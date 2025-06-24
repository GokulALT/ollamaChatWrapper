import { type NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const { name } = (await req.json()) as { name: string };

    if (!name) {
      return new Response(JSON.stringify({ error: 'Model name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok || !ollamaResponse.body) {
      const errorBody = await ollamaResponse.text();
      console.error(`Ollama pull API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`, errorBody);
      return new Response(JSON.stringify({ error: `Ollama API error: ${ollamaResponse.statusText}`, details: errorBody }), { status: ollamaResponse.status, headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(ollamaResponse.body, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });

  } catch (error: any) {
    console.error('Error in /api/ollama/pull:', error);
    return new Response(JSON.stringify({ error: 'Failed to process pull request.', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
