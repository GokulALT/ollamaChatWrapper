
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const mcpBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:8008';
  try {
    // A lightweight request to check if the MCP server is responsive.
    const response = await fetch(mcpBaseUrl, { method: 'GET', signal: AbortSignal.timeout(3000) }); // 3-second timeout
    if (response.ok) {
      return NextResponse.json({ online: true, message: 'MCP server is responsive.' });
    } else {
      return NextResponse.json({ online: false, message: `MCP server responded with status: ${response.status}` }, { status: 200 }); // Still 200 for the API call, but online: false
    }
  } catch (error: any) {
    console.warn('Error checking MCP status:', error.name === 'TimeoutError' ? 'Request timed out' : error.message);
    let errorMessage = 'Could not connect to MCP server.';
    if (error.name === 'TimeoutError') {
      errorMessage = 'Connection to MCP server timed out.';
    } else if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
      errorMessage = 'Connection to MCP server refused. Is it running?';
    }
    return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 }); // Still 200 for the API call
  }
}
