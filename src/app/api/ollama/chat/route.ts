
import { type NextRequest } from 'next/server';
import type { ChatMessageData } from '@/types/chat';

// Helper to parse OpenAI-compatible Server-Sent Events (SSE) stream (for MCP)
async function* OpenAIStreamTransformer(stream: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6);
          if (jsonStr.trim() === '[DONE]') {
            return; // End of stream
          }
          try {
            const jsonChunk = JSON.parse(jsonStr);
            const content = jsonChunk.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.error("Failed to parse JSON chunk from OpenAI stream:", jsonStr, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error transforming OpenAI compatible stream:", error);
    yield "[Error processing response]";
  } finally {
    reader.releaseLock();
  }
}

// Helper to parse Ollama's native streaming format (for Direct mode)
async function* OllamaStreamTransformer(stream: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const jsonChunk = JSON.parse(line);
            const content = jsonChunk.message?.content;
            if (content) {
              yield content;
            }
            if (jsonChunk.done) {
              return;
            }
          } catch (e) {
            console.error("Failed to parse JSON chunk from Ollama stream:", line, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error transforming Ollama stream:", error);
    yield "[Error processing response]";
  } finally {
    reader.releaseLock();
  }
}

export async function POST(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const { model, messages, system, connectionMode } = (await req.json()) as { model: string; messages: ChatMessageData[]; system?: string; connectionMode: 'mcp' | 'direct' };

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing model or messages in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    if (system && system.trim()) {
      apiMessages.unshift({ role: 'system', content: system });
    }

    let apiEndpoint: string;
    let requestBody: any;
    let responseStreamTransformer: (stream: ReadableStream<Uint8Array>) => AsyncIterable<string>;

    if (connectionMode === 'mcp') {
      apiEndpoint = `${ollamaBaseUrl}/v1/chat/completions`;
      requestBody = {
        model: model,
        messages: apiMessages,
        stream: true,
      };
      responseStreamTransformer = OpenAIStreamTransformer;
    } else { // Direct Mode
      apiEndpoint = `${ollamaBaseUrl}/api/chat`;
      // Direct Ollama uses a different body structure
      const directMessages = messages.map(m => ({ role: m.sender, content: m.text }));
      requestBody = {
        model: model,
        messages: directMessages,
        stream: true,
        options: {
          system: system,
        }
      };
      responseStreamTransformer = OllamaStreamTransformer;
    }

    const apiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok || !apiResponse.body) {
      const errorBody = await apiResponse.text();
      console.error(`API error: ${apiResponse.status} ${apiResponse.statusText}`, errorBody);
      return new Response(JSON.stringify({ error: `API error: ${apiResponse.statusText}`, details: errorBody }), { status: apiResponse.status, headers: { 'Content-Type': 'application/json' } });
    }
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const contentChunk of responseStreamTransformer(apiResponse.body!)) {
          controller.enqueue(encoder.encode(contentChunk));
        }
        controller.close();
      },
      cancel() {
        apiResponse.body?.cancel();
      }
    });

    return new Response(transformedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });

  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
