
import { type NextRequest } from 'next/server';
import type { ChatMessageData } from '@/types/chat';

// Helper to parse newline-delimited JSON stream from Ollama
async function* OllamaResponseTransformer(stream: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          const jsonChunk = JSON.parse(buffer);
          if (jsonChunk.message && jsonChunk.message.content) {
            yield jsonChunk.message.content;
          }
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line

      for (const line of lines) {
        if (line.trim()) {
          const jsonChunk = JSON.parse(line);
          if (jsonChunk.message && jsonChunk.message.content) {
            yield jsonChunk.message.content;
          }
          if (jsonChunk.done) { // Check for done flag within a line
            return; // End generation if Ollama signals done
          }
        }
      }
    }
  } catch (error) {
    console.error("Error transforming Ollama stream:", error);
    // Optionally yield an error message or handle differently
    yield "[Error processing Ollama response]";
  }
  finally {
    reader.releaseLock();
  }
}


export async function POST(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const { model, messages } = (await req.json()) as { model: string; messages: ChatMessageData[] };

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing model or messages in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Transform messages for Ollama API
    const ollamaMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok || !ollamaResponse.body) {
      const errorBody = await ollamaResponse.text();
      console.error(`Ollama chat API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`, errorBody);
      return new Response(JSON.stringify({ error: `Ollama API error: ${ollamaResponse.statusText}`, details: errorBody }), { status: ollamaResponse.status, headers: { 'Content-Type': 'application/json' } });
    }
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const contentChunk of OllamaResponseTransformer(ollamaResponse.body)) {
          controller.enqueue(encoder.encode(contentChunk));
        }
        controller.close();
      },
      cancel() {
        ollamaResponse.body?.cancel();
      }
    });

    return new Response(transformedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });

  } catch (error: any) {
    console.error('Error in /api/ollama/chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
