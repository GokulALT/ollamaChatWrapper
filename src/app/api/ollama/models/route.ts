
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch models from Ollama: ${response.statusText}`, details: errorBody }, { status: response.status });
    }
    const data = await response.json();
    // Transform data to match the expected { id: string, name: string } structure
    const models = data.models.map((model: any) => ({
      id: model.name,
      name: model.name, // Or a more friendly parsed name if desired
    }));
    return NextResponse.json(models);
  } catch (error: any) {
    console.error('Error fetching models from Ollama:', error);
    return NextResponse.json({ error: 'Could not connect to Ollama server or an unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
