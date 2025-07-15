
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const baseUrl = req.headers.get('X-Ollama-Url') || process.env.OLLAMA_BASE_URL;
  const mode = req.nextUrl.searchParams.get('mode') || 'mcp';
  
  if (!baseUrl) {
    return NextResponse.json({ error: `URL for ${mode.toUpperCase()} is not configured.` }, { status: 500 });
  }

  try {
    if (mode === 'mcp') {
      // MCP exposes an OpenAI-compatible /v1/models endpoint
      const response = await fetch(`${baseUrl}/v1/models`);
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
      const response = await fetch(`${baseUrl}/api/tags`);
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
