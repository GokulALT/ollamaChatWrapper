
import { type NextRequest, NextResponse } from 'next/server';
import { ChromaClient, type ChromaClientParams } from 'chromadb';

// Helper function to get ChromaClient with authentication support
function getChromaClient(req: NextRequest) {
    const chromaUrl = req.headers.get('X-Chroma-Url') || process.env.CHROMA_URL;
    if (!chromaUrl) return null;

    const authMethod = process.env.CHROMA_AUTH_METHOD;
    const token = process.env.CHROMA_TOKEN;
    const username = process.env.CHROMA_USERNAME;
    const password = process.env.CHROMA_PASSWORD;

    const params: ChromaClientParams = { path: chromaUrl };

    if (authMethod === 'token' && token) {
        params.auth = { token };
    } else if (authMethod === 'basic' && username && password) {
        params.auth = { username, password };
    }
    
    return new ChromaClient(params);
}

export async function GET(req: NextRequest) {
    const client = getChromaClient(req);
    if (!client) {
        return NextResponse.json({ online: false, message: 'ChromaDB URL is not configured.' }, { status: 200 });
    }

    try {
        // The heartbeat is a lightweight way to check for a connection.
        await client.heartbeat();
        return NextResponse.json({ online: true, message: 'Connection successful.' });
    } catch (error: any) {
        let errorMessage = "Could not connect to ChromaDB.";
        if (error.message && error.message.includes('fetch failed')) {
            errorMessage = "Connection refused. Is ChromaDB running?";
        } else if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            errorMessage = "Authentication failed. Check credentials.";
        }
        return NextResponse.json({ online: false, message: errorMessage, details: error.message }, { status: 200 });
    }
}
