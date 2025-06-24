import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const { name } = (await req.json()) as { name: string };

    if (!name) {
        return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    const response = await fetch(`${ollamaBaseUrl}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ollama delete API error: ${response.status} ${response.statusText}`, errorBody);
      if (response.status === 404) {
          return NextResponse.json({ error: `Model '${name}' not found on Ollama server.`, details: errorBody }, { status: 404 });
      }
      return NextResponse.json({ error: `Failed to delete model from Ollama: ${response.statusText}`, details: errorBody }, { status: response.status });
    }
    
    return NextResponse.json({ message: 'Model deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting model from Ollama:', error);
    return NextResponse.json({ error: 'Could not connect to Ollama server or an unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
