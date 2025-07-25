
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const baseUrl = req.headers.get('X-Ollama-Url') || process.env.OLLAMA_BASE_URL;
  const mode = req.nextUrl.searchParams.get('mode') || 'mcp';
  const serverName = mode.toUpperCase();

  if (!baseUrl) {
    return NextResponse.json({ online: false, message: `URL for ${serverName} is not configured.` }, { status: 200 });
  }

  try {
    const endpoint = mode === 'direct' ? `${baseUrl}/api/tags` : `${baseUrl}/v1/models`;
    const response = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(3000) }); // 3-second timeout
    
    if (response.ok) {
      return NextResponse.json({ online: true, message: `Connection successful.` });
    } else {
      return NextResponse.json({ online: false, message: `Server responded with status: ${response.status}` }, { status: 200 });
    }
  } catch (error: any) {
    console.warn(`Error checking ${serverName} status:`, error.name === 'TimeoutError' ? 'Request timed out' : error.message);
    let errorMessage = `Could not connect to server.`;
    if (error.name === 'TimeoutError') {
      errorMessage = `Connection timed out.`;
    } else if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
      errorMessage = `Connection refused. Is the server running?`;
    }
    return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 });
  }
}
