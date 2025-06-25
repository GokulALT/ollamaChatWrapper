
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // This now points to your MCP server URL.
  const mcpBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:8008';
  try {
    // MCP exposes an OpenAI-compatible /models endpoint
    const response = await fetch(`${mcpBaseUrl}/models`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`MCP API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch models from MCP: ${response.statusText}`, details: errorBody }, { status: response.status });
    }
    const data = await response.json();
    
    // Transform OpenAI-compatible data to the expected { id: string, name: string } structure
    // The data object from an OpenAI-compatible /models endpoint has a "data" property which is an array.
    const models = data.data.map((model: any) => ({
      id: model.id,
      name: model.id, 
    }));
    return NextResponse.json(models);
  } catch (error: any) {
    console.error('Error fetching models from MCP:', error);
    return NextResponse.json({ error: 'Could not connect to MCP server or an unexpected error occurred.', details: error.message }, { status: 500 });
  }
}
