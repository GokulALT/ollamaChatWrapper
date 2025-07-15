
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
    const chroma = getChromaClient(req);
    if (!chroma) {
        return NextResponse.json({ error: 'ChromaDB URL is not configured.' }, { status: 500 });
    }
    try {
        const collections = await chroma.listCollections();

        const formattedCollections = collections.map((c: any) => {
            if (typeof c === 'string') {
                return { id: c, name: c };
            }
            return { id: c.id, name: c.name };
        });

        return NextResponse.json(formattedCollections);
    } catch (error: any) {
        console.error('Error listing collections:', error);
        return NextResponse.json({ error: 'Failed to list collections', details: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const chroma = getChromaClient(req);
    if (!chroma) {
        return NextResponse.json({ error: 'ChromaDB URL is not configured.' }, { status: 400 });
    }
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }
        const collection = await chroma.createCollection({ name });
        return NextResponse.json(collection);
    } catch (error: any) {
        console.error('Error creating collection:', error);
        if (error.message && error.message.includes('already exists')) {
            return NextResponse.json({ error: `Collection '${error.message.split("'")[1]}' already exists.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create collection', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const chroma = getChromaClient(req);
    if (!chroma) {
        return NextResponse.json({ error: 'ChromaDB URL is not configured.' }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    try {
        if (!name) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }
        await chroma.deleteCollection({ name });
        return NextResponse.json({ message: `Collection "${name}" deleted.` });
    } catch (error: any) {
        console.error('Error deleting collection:', error);
        return NextResponse.json({ error: 'Failed to delete collection', details: error.message }, { status: 500 });
    }
}
