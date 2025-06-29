
import { type NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';

export async function GET(req: NextRequest) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    try {
        const client = new ChromaClient({ path: chromaUrl });
        // The heartbeat is a lightweight way to check for a connection.
        await client.heartbeat();
        return NextResponse.json({ online: true, message: 'Connection successful.' });
    } catch (error: any) {
        let errorMessage = "Could not connect to ChromaDB.";
        if (error.message && error.message.includes('fetch failed')) {
            errorMessage = "Connection refused. Is ChromaDB running?";
        }
        return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 });
    }
}
