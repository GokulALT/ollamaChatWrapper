
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const baseUrl = req.headers.get('X-Ollama-Url') || process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'Ollama URL is not configured.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const modelName = body.name;

    if (!modelName) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }
    
    const response = await fetch(`${baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to delete model: ${response.status}`, errorText);
        return NextResponse.json({ error: `Failed to delete model: ${errorText}` }, { status: response.status });
    }

    return NextResponse.json({ message: `Successfully deleted model ${modelName}` });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json({ error: 'Failed to delete model', details: error.message }, { status: 500 });
  }
}
