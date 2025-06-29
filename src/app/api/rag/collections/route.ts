
import { type NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';

export async function GET(req: NextRequest) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    try {
        const chroma = new ChromaClient({ path: chromaUrl });
        const collections = await chroma.listCollections();
        return NextResponse.json(collections);
    } catch (error: any) {
        console.error('Error listing collections:', error);
        return NextResponse.json({ error: 'Failed to list collections', details: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }
        const chroma = new ChromaClient({ path: chromaUrl });
        const collection = await chroma.createCollection({ name });
        return NextResponse.json(collection);
    } catch (error: any) {
        console.error('Error creating collection:', error);
        // ChromaDB-ts might throw an error with a specific message for duplicates
        if (error.message && error.message.includes('already exists')) {
            return NextResponse.json({ error: `Collection '${error.message.split("'")[1]}' already exists.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create collection', details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    try {
        if (!name) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }
        const chroma = new ChromaClient({ path: chromaUrl });
        await chroma.deleteCollection({ name });
        return NextResponse.json({ message: `Collection "${name}" deleted.` });
    } catch (error: any) {
        console.error('Error deleting collection:', error);
        return NextResponse.json({ error: 'Failed to delete collection', details: error.message }, { status: 500 });
    }
}
