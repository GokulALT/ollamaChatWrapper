
import { type NextRequest } from 'next/server';
import type { ChatMessageData } from '@/types/chat';

// Helper to parse OpenAI-compatible Server-Sent Events (SSE) stream
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
            console.error("Failed to parse JSON chunk from stream:", jsonStr);
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


export async function POST(req: NextRequest) {
  // This now points to your MCP server URL.
  const mcpBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:8008';
  try {
    const { model, messages, system } = (await req.json()) as { model: string; messages: ChatMessageData[]; system?: string };

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing model or messages in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Transform messages for the OpenAI-compatible API
    const apiMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    if (system && system.trim()) {
      apiMessages.unshift({ role: 'system', content: system });
    }

    const requestBody = {
      model: model,
      messages: apiMessages,
      stream: true,
    };

    // MCP uses the /chat/completions endpoint, similar to OpenAI.
    const mcpResponse = await fetch(`${mcpBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!mcpResponse.ok || !mcpResponse.body) {
      const errorBody = await mcpResponse.text();
      console.error(`MCP chat API error: ${mcpResponse.status} ${mcpResponse.statusText}`, errorBody);
      return new Response(JSON.stringify({ error: `MCP API error: ${mcpResponse.statusText}`, details: errorBody }), { status: mcpResponse.status, headers: { 'Content-Type': 'application/json' } });
    }
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const contentChunk of OpenAIStreamTransformer(mcpResponse.body)) {
          controller.enqueue(encoder.encode(contentChunk));
        }
        controller.close();
      },
      cancel() {
        mcpResponse.body?.cancel();
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
