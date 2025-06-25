
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const mode = req.nextUrl.searchParams.get('mode') || 'mcp';
  const serverName = mode.toUpperCase();

  try {
    const endpoint = mode === 'direct' ? `${baseUrl}/api/tags` : baseUrl;
    const response = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(3000) }); // 3-second timeout
    
    if (response.ok) {
      return NextResponse.json({ online: true, message: `${serverName} server is responsive.` });
    } else {
      return NextResponse.json({ online: false, message: `${serverName} server responded with status: ${response.status}` }, { status: 200 });
    }
  } catch (error: any) {
    console.warn(`Error checking ${serverName} status:`, error.name === 'TimeoutError' ? 'Request timed out' : error.message);
    let errorMessage = `Could not connect to ${serverName} server.`;
    if (error.name === 'TimeoutError') {
      errorMessage = `Connection to ${serverName} server timed out.`;
    } else if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
      errorMessage = `Connection to ${serverName} server refused. Is it running?`;
    }
    return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 });
  }
}
