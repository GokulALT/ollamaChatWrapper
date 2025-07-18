
import { type NextRequest, NextResponse } from 'next/server';
import { ChromaClient, type ChromaClientParams } from 'chromadb';
import mammoth from 'mammoth';

// Ollama client for embedding
class OllamaEmbeddingFunction {
    private ollamaUrl: string;
    private model: string;

    constructor(ollamaUrl: string, model: string) {
        this.ollamaUrl = ollamaUrl;
        this.model = model;
    }

    public async generate(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (const text of texts) {
            const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.model, prompt: text }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to get embedding from Ollama: ${errorBody}`);
            }
            const data = await response.json();
            embeddings.push(data.embedding);
        }
        return embeddings;
    }
}

async function chunkText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): Promise<string[]> {
    const chunks: string[] = [];
    if (text.length <= chunkSize) {
        return [text];
    }
    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, i + chunkSize));
        i += chunkSize - chunkOverlap;
    }
    return chunks;
}

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

export async function POST(req: NextRequest) {
    const ollamaBaseUrl = req.headers.get('X-Ollama-Url') || process.env.OLLAMA_BASE_URL;
    if (!ollamaBaseUrl) {
        return NextResponse.json({ error: 'Ollama URL is not configured.' }, { status: 400 });
    }

    const chroma = getChromaClient(req);
     if (!chroma) {
        return NextResponse.json({ error: 'ChromaDB URL is not configured.' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const collectionName = formData.get('collectionName') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        if (!collectionName) {
            return NextResponse.json({ error: 'No collection name provided.' }, { status: 400 });
        }
        
        let text = '';
        if (file.type ) {
            text = await file.text();
        } else  {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } 
        // else {
        //      return NextResponse.json({ error: 'Only .txt and .docx files are supported.' }, { status: 400 });
        // }

        if (!text.trim()) {
            return NextResponse.json({ error: 'The document appears to be empty.' }, { status: 400 });
        }

        const chunks = await chunkText(text);
        
        const embedder = new OllamaEmbeddingFunction(ollamaBaseUrl, 'nomic-embed-text');

        const collection = await chroma.getOrCreateCollection({
            name: collectionName,
            embeddingFunction: embedder
        });
        
        const ids = chunks.map((_, index) => `${file.name}-${Date.now()}-${index}`);
        
        await collection.add({
            ids: ids,
            documents: chunks,
            metadatas: chunks.map(() => ({ source: file.name })),
        });

        return NextResponse.json({ message: 'File processed successfully.', count: chunks.length });

    } catch (error: any) {
        console.error('Error processing file upload:', error);
        return NextResponse.json({ error: 'Failed to process file.', details: error.message }, { status: 500 });
    }
}
