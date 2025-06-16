
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    // A lightweight request to check if Ollama server is responsive.
    // Ollama root returns "Ollama is running".
    const response = await fetch(ollamaBaseUrl, { method: 'GET', signal: AbortSignal.timeout(3000) }); // 3-second timeout
    if (response.ok) {
      // You could also check response.text() === "Ollama is running" for a more specific check
      return NextResponse.json({ online: true, message: 'Ollama server is responsive.' });
    } else {
      return NextResponse.json({ online: false, message: `Ollama server responded with status: ${response.status}` }, { status: 200 }); // Still 200 for the API call, but online: false
    }
  } catch (error: any) {
    console.warn('Error checking Ollama status:', error.name === 'TimeoutError' ? 'Request timed out' : error.message);
    let errorMessage = 'Could not connect to Ollama server.';
    if (error.name === 'TimeoutError') {
      errorMessage = 'Connection to Ollama server timed out.';
    } else if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
      errorMessage = 'Connection to Ollama server refused. Is it running?';
    }
    return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 }); // Still 200 for the API call
  }
}
