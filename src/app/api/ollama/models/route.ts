
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const mode = req.nextUrl.searchParams.get('mode') || 'mcp';

  try {
    if (mode === 'mcp') {
      // MCP exposes an OpenAI-compatible /models endpoint
      const response = await fetch(`${ollamaBaseUrl}/models`);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`MCP API error: ${response.status} ${response.statusText}`, errorBody);
        return NextResponse.json({ error: `Failed to fetch models from MCP: ${response.statusText}`, details: errorBody }, { status: response.status });
      }
      const data = await response.json();
      
      const models = data.data.map((model: any) => ({
        id: model.id,
        name: model.id, 
      }));
      return NextResponse.json(models);
    } else { // Direct Mode
      const response = await fetch(`${ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorBody);
        return NextResponse.json({ error: `Failed to fetch models from Ollama: ${response.statusText}`, details: errorBody }, { status: response.status });
      }
      const data = await response.json();
      
      const models = data.models.map((model: any) => ({
        id: model.name, // In direct mode, the name is the ID
        name: model.name,
      }));
      return NextResponse.json(models);
    }
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: `Could not connect to ${mode.toUpperCase()} server or an unexpected error occurred.`, details: error.message }, { status: 500 });
  }
}
