
import {type NextRequest} from 'next/server';
import {ChromaClient, type ChromaClientParams} from 'chromadb';
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions';

interface RagChatParams {
  req: NextRequest;
  model: string;
  collection: string;
  messages: ChatCompletionMessageParam[];
  systemPrompt?: string;
  temperature?: number;
}

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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({model: this.model, prompt: text}),
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

  const params: ChromaClientParams = {path: chromaUrl};

  if (authMethod === 'token' && token) {
    params.auth = {token};
  } else if (authMethod === 'basic' && username && password) {
    params.auth = {username, password};
  }

  return new ChromaClient(params);
}

// Function to call the LLM for re-ranking documents.
async function rerankDocuments(
  ollamaBaseUrl: string,
  model: string,
  query: string,
  documents: {id: string; pageContent: string; metadata: any}[]
): Promise<{id: string; pageContent: string; metadata: any}[]> {
  try {
    const documentsString = documents
      .map((doc, i) => `--- Document ${i} (ID: ${doc.id}) ---\n${doc.pageContent}`)
      .join('\n');

    const rerankPrompt = `You are a highly intelligent relevance-ranking assistant. Your task is to re-rank a list of retrieved documents based on their relevance to a user's query.

User Query: "${query}"

Documents to rank:
${documentsString}

Instructions:
1. Carefully read the user query and each document.
2. Determine which documents are most relevant to answering the query.
3. Return a JSON object containing a single key "ranked_ids" with a value that is an array of the document IDs, sorted from most to least relevant.
4. Only include IDs of documents that are clearly relevant. Do not include irrelevant documents.
5. If no documents are relevant, return an empty array.
6. Your response MUST be only the JSON object, with no other text or explanation.

Example Response:
{
  "ranked_ids": ["doc-3-1", "doc-1-0", "doc-2-2"]
}
`;

    const apiResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: model,
        messages: [{role: 'user', content: rerankPrompt}],
        stream: false, // We need a single JSON response, not a stream
        format: 'json', // Request JSON output from Ollama
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('Re-ranking API call failed:', errorBody);
      // Fallback to original document order if re-ranking fails
      return documents;
    }

    const responseJson = await apiResponse.json();
    const responseContent = JSON.parse(responseJson.message.content);
    const rankedIds = responseContent.ranked_ids as string[];

    if (!rankedIds || !Array.isArray(rankedIds)) {
      console.warn(
        "Re-ranking did not return a valid 'ranked_ids' array. Returning original order."
      );
      return documents;
    }

    const rankedDocuments = rankedIds
      .map(id => documents.find(doc => doc.id === id))
      .filter(doc => doc !== undefined) as {
      id: string;
      pageContent: string;
      metadata: any;
    }[];

    // If re-ranking returns no relevant docs, use the top 2 from the original retrieval as a fallback
    return rankedDocuments.length > 0
      ? rankedDocuments
      : documents.slice(0, 2);
  } catch (error) {
    console.error('Error during re-ranking, returning original documents:', error);
    // In case of any error during re-ranking, fall back to the original list.
    return documents;
  }
}

export async function handleRagChat({
  req,
  model,
  collection: collectionName,
  messages,
  systemPrompt,
  temperature,
}: RagChatParams): Promise<ReadableStream<Uint8Array>> {
  const ollamaBaseUrl = req.headers.get('X-Ollama-Url');
  if (!ollamaBaseUrl) {
    throw new Error('Ollama URL is not configured.');
  }

  const chroma = getChromaClient(req);
  if (!chroma) {
    throw new Error('ChromaDB URL is not configured.');
  }

  const latestQuery = messages[messages.length - 1].content as string;

  // 1. Get initial set of documents from ChromaDB (fetch more to re-rank)
  const embedder = new OllamaEmbeddingFunction(ollamaBaseUrl, 'nomic-embed-text');

  const collection = await chroma.getCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });
  const results = await collection.query({
    queryTexts: [latestQuery],
    nResults: 10, // Fetch more results for re-ranking
  });

  const initialDocs = results.documents[0].map((doc, i) => ({
    id: results.ids[0][i],
    pageContent: doc,
    metadata: results.metadatas[0][i] || {},
  }));

  // 2. Re-rank documents using the LLM
  const rerankedDocs = await rerankDocuments(
    ollamaBaseUrl,
    model,
    latestQuery,
    initialDocs
  );

  // Take the top 5 after re-ranking
  const finalDocs = rerankedDocs.slice(0, 5);

  const contextText = finalDocs.map(d => d.pageContent).join('\n---\n');

  // 3. Construct prompt for the LLM, combining user's system prompt with RAG context
  const baseRagPrompt = `You are an expert question-answering assistant. Use the following retrieved context to answer the user's question. If the context doesn't contain the answer, state that you don't know. Do not use any other information.

---
CONTEXT:
${contextText}
---`;

  const ragSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${baseRagPrompt}`
    : baseRagPrompt;

  const apiMessages: ChatCompletionMessageParam[] = [
    {role: 'system', content: ragSystemPrompt},
    ...messages,
  ];

  // 4. Call Ollama to generate a response
  const apiResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: model,
      messages: apiMessages,
      stream: true,
      options: {
        temperature: temperature,
      },
    }),
  });

  if (!apiResponse.ok || !apiResponse.body) {
    const errorBody = await apiResponse.text();
    throw new Error(`Ollama API error: ${apiResponse.statusText} - ${errorBody}`);
  }

  // 5. Stream the response back, prefixed with the sources
  const transformedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // First, send the sources as a JSON chunk
      const sourcesPayload = JSON.stringify(finalDocs);
      controller.enqueue(encoder.encode(sourcesPayload + RESPONSE_SEPARATOR));

      // Then, stream the AI's response
      const reader = apiResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream: true});
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
              console.error('Failed to parse RAG chat stream chunk:', line, e);
            }
          }
        }
      }
      controller.close();
    },
  });

  return transformedStream;
}
