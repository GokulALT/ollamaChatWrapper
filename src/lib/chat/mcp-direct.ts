
import {type NextRequest} from 'next/server';
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import type {ConnectionMode} from '@/types/chat';

interface McpDirectChatParams {
  req: NextRequest;
  model: string;
  messages: ChatCompletionMessageParam[];
  systemPrompt?: string;
  temperature?: number;
  connectionMode: 'mcp' | 'direct';
}

// Helper to parse OpenAI-compatible Server-Sent Events (SSE) stream (for MCP)
async function* openAIStreamTransformer(
  stream: ReadableStream<Uint8Array>
): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, {stream: true});
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
            console.error(
              'Failed to parse JSON chunk from OpenAI stream:',
              jsonStr,
              e
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error transforming OpenAI compatible stream:', error);
    yield '[Error processing response]';
  } finally {
    reader.releaseLock();
  }
}

// Helper to parse Ollama's native streaming format (for Direct mode)
async function* ollamaStreamTransformer(
  stream: ReadableStream<Uint8Array>
): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
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
            console.error(
              'Failed to parse JSON chunk from Ollama stream:',
              line,
              e
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error transforming Ollama stream:', error);
    yield '[Error processing response]';
  } finally {
    reader.releaseLock();
  }
}

export async function handleMcpDirectChat({
  req,
  model,
  messages,
  systemPrompt,
  temperature,
  connectionMode,
}: McpDirectChatParams): Promise<ReadableStream<Uint8Array>> {
  const headerKey =
    connectionMode === 'mcp' ? 'X-Mcp-Url' : 'X-Ollama-Url';
  const baseUrl = req.headers.get(headerKey);

  if (!baseUrl) {
    throw new Error(
      `URL for ${connectionMode.toUpperCase()} mode is not configured`
    );
  }
  if (!model || !messages) {
    throw new Error('Missing model or messages in request body');
  }

  let apiEndpoint: string;
  let requestBody: any;
  let responseStreamTransformer: (
    stream: ReadableStream<Uint8Array>
  ) => AsyncIterable<string>;

  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  if (systemPrompt && systemPrompt.trim() && connectionMode === 'mcp') {
    apiMessages.unshift({role: 'system', content: systemPrompt});
  }

  if (connectionMode === 'mcp') {
    apiEndpoint = `${baseUrl}/v1/chat/completions`;
    requestBody = {
      model: model,
      messages: apiMessages,
      stream: true,
      temperature: temperature,
    };
    responseStreamTransformer = openAIStreamTransformer;
  } else {
    // Direct Mode
    apiEndpoint = `${baseUrl}/api/chat`;
    // Direct Ollama uses a different body structure
    requestBody = {
      model: model,
      messages: apiMessages,
      stream: true,
      options: {
        system: systemPrompt,
        temperature: temperature,
      },
    };
    responseStreamTransformer = ollamaStreamTransformer;
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
    console.error(
      `API error: ${apiResponse.status} ${apiResponse.statusText}`,
      errorBody
    );
    throw new Error(`API error: ${apiResponse.statusText} - ${errorBody}`);
  }

  const transformedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const contentChunk of responseStreamTransformer(
        apiResponse.body!
      )) {
        controller.enqueue(encoder.encode(contentChunk));
      }
      controller.close();
    },
    cancel() {
      apiResponse.body?.cancel();
    },
  });

  return transformedStream;
}
