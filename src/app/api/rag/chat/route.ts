
import { type NextRequest } from 'next/server';
import { ChromaClient, type ChromaClientParams } from 'chromadb';
import type { ChatMessageData, Source } from '@/types/chat';

export const runtime = 'edge';

const RESPONSE_SEPARATOR = '_--_SEPARATOR_--_';

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
         return new Response(JSON.stringify({ error: 'Ollama URL is not configured.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const chroma = getChromaClient(req);
    if (!chroma) {
        return new Response(JSON.stringify({ error: 'ChromaDB URL is not configured.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    try {
        const { model, messages, collection: collectionName, system } = (await req.json()) as {
            model: string;
            messages: ChatMessageData[];
            collection: string;
            system?: string;
        };
        
        if (!collectionName) {
            return new Response(JSON.stringify({ error: 'Missing collection name in request body' }), { status: 400 });
        }
        if (!model) {
            return new Response(JSON.stringify({ error: 'Missing model in request body' }), { status: 400 });
        }
        if (!messages || messages.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing messages in request body' }), { status: 400 });
        }

        const latestQuery = messages[messages.length - 1].text;

        // 1. Get relevant context from ChromaDB
        const embedder = new OllamaEmbeddingFunction(ollamaBaseUrl, 'nomic-embed-text');
        
        const collection = await chroma.getCollection({ name: collectionName, embeddingFunction: embedder });
        const results = await collection.query({
            queryTexts: [latestQuery],
            nResults: 5,
        });
        
        const contextDocs = results.documents[0].map((doc, i) => ({ 
            id: results.ids[0][i], 
            pageContent: doc,
            metadata: results.metadatas[0][i] || {}
        }));
        
        const contextText = contextDocs.map(d => d.pageContent).join('\n---\n');

        // 2. Construct prompt for the LLM, combining user's system prompt with RAG context
        const baseRagPrompt = `You are an expert question-answering assistant. Use the following retrieved context to answer the user's question. If the context doesn't contain the answer, state that you don't know. Do not use any other information.

---
CONTEXT:
${contextText}
---`;
        
        const ragSystemPrompt = system ? `${system}\n\n${baseRagPrompt}` : baseRagPrompt;

        // Map messages to the format Ollama expects
        const userMessages = messages.map(msg => ({
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.text,
        }));

        // Prepend the system prompt to the message history. This is more reliable than using the `options` field.
        const apiMessages = [
            { role: 'system', content: ragSystemPrompt },
            ...userMessages
        ];

        // 3. Call Ollama to generate a response
        const apiResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: apiMessages,
                stream: true,
            }),
        });

        if (!apiResponse.ok || !apiResponse.body) {
            const errorBody = await apiResponse.text();
            throw new Error(`Ollama API error: ${apiResponse.statusText} - ${errorBody}`);
        }

        // 4. Stream the response back, prefixed with the sources
        const transformedStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                // First, send the sources as a JSON chunk
                const sourcesPayload = JSON.stringify(contextDocs);
                controller.enqueue(encoder.encode(sourcesPayload + RESPONSE_SEPARATOR));

                // Then, stream the AI's response
                const reader = apiResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const jsonChunk = JSON.parse(line);
                                if (jsonChunk.message?.content) {
                                    controller.enqueue(encoder.encode(jsonChunk.message.content));
                                }
                                if (jsonChunk.done) {
                                    controller.close();
                                    return;
                                }
                            } catch (e) {
                                console.error("Failed to parse RAG chat stream chunk:", line, e);
                            }
                        }
                    }
                }
                controller.close();
            }
        });

        return new Response(transformedStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error('Error in RAG chat API route:', error);
        return new Response(JSON.stringify({ error: 'Failed to process RAG chat request.', details: error.message }), { status: 500 });
    }
}
