
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const baseUrl = req.headers.get('X-Ollama-Url') || process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return new Response('Ollama URL is not configured.', { status: 400 });
  }
  
  try {
    const body = await req.json();
    const modelName = body.name;

    if (!modelName) {
      return new Response('Model name is required', { status: 400 });
    }

    const response = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName, stream: true }),
    });
    
    if (!response.ok || !response.body) {
      const errorText = await response.text();
      console.error('Failed to pull model:', errorText);
      return new Response(errorText, { status: response.status });
    }
    
    // Stream the response back to the client
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Error pulling model:', error);
    return new Response(JSON.stringify({ error: 'Failed to pull model', details: error.message }), { status: 500 });
  }
}
