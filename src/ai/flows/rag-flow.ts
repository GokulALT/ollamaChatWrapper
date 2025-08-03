
'use server';

import {ai} from '@/ai/genkit';
import {ChromaClient, type ChromaClientParams} from 'chromadb';
import type {MessageData, Part} from 'genkit';
import {GenerateRequest, ModelArgument, generate} from 'genkit/generate';
import {z} from 'zod';

const RagRequestSchema = z.object({
  prompt: z.array(z.any()),
  history: z.array(z.any()),
  llm: z.any(), // Assuming ModelArgument can't be directly represented in Zod
  collection: z.string(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  ollamaHost: z.string(),
  chromaHost: z.string(),
  enableReranking: z.boolean().default(true),
});

type RagRequest = z.infer<typeof RagRequestSchema> & {llm: ModelArgument};

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

function getChromaClient(chromaUrl: string) {
  if (!chromaUrl) return null;
  const params: ChromaClientParams = {path: chromaUrl};
  return new ChromaClient(params);
}

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
}`;
    const llm = ai.model(model);
    const {candidates} = await generate({
      model: llm,
      prompt: rerankPrompt,
      config: {
        temperature: 0,
      },
      output: {
        format: 'json',
      },
    });

    const responseContent = JSON.parse(candidates[0]!.message.content[0].text!);
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

    return rankedDocuments.length > 0
      ? rankedDocuments
      : documents.slice(0, 2);
  } catch (error) {
    console.error('Error during re-ranking, returning original documents:', error);
    return documents;
  }
}

export const rag = ai.flow(
  {
    name: 'rag',
    inputSchema: RagRequestSchema,
    outputSchema: z.string(),
  },
  async (request: RagRequest) => {
    const RESPONSE_SEPARATOR = '_--_SEPARATOR_--_';
    const embedder = new OllamaEmbeddingFunction(
      request.ollamaHost,
      'nomic-embed-text'
    );
    const chroma = getChromaClient(request.chromaHost);
    if (!chroma) {
      throw new Error('ChromaDB URL is not configured.');
    }
    const collection = await chroma.getCollection({
      name: request.collection,
      embeddingFunction: embedder,
    });
    const queryText = (request.prompt[0] as Part).text!;
    const results = await collection.query({
      queryTexts: [queryText],
      nResults: 10,
    });
    const initialDocs = results.documents[0].map((doc, i) => ({
      id: results.ids[0][i],
      pageContent: doc!,
      metadata: results.metadatas[0][i] || {},
    }));

    let finalDocs;
    if (request.enableReranking) {
      const llmName = typeof request.llm === 'string' ? request.llm : 'ollama/llama3';
      const rerankedDocs = await rerankDocuments(
        request.ollamaHost,
        llmName,
        queryText,
        initialDocs
      );
      finalDocs = rerankedDocs.slice(0, 5);
    } else {
      finalDocs = initialDocs.slice(0, 5);
    }


    const contextText = finalDocs.map(d => d.pageContent).join('\n---\n');

    const baseRagPrompt = `You are an expert question-answering assistant. Use the following retrieved context to answer the user's question. If the context doesn't contain the answer, state that you don't know. Do not use any other information.

---
CONTEXT:
${contextText}
---`;

    const systemPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${baseRagPrompt}`
      : baseRagPrompt;

    const generateRequest: GenerateRequest = {
      prompt: request.prompt,
      history: request.history as MessageData[],
      model: request.llm,
      config: {
        temperature: request.temperature,
      },
      output: {
        format: 'text',
      },
    };

    const {stream, response} = generate(generateRequest);

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const data = chunk.content;
        controller.enqueue(data);
      },
    });

    const sourcesPayload = JSON.stringify(finalDocs);
    const prefix = sourcesPayload + RESPONSE_SEPARATOR;
    const prefixStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(prefix));
        controller.close();
      },
    });

    const combinedStream = new ReadableStream({
      async start(controller) {
        const prefixReader = prefixStream.getReader();
        while (true) {
          const {done, value} = await prefixReader.read();
          if (done) break;
          controller.enqueue(value);
        }

        const mainReader = stream().pipeThrough(transformStream).getReader();
        while (true) {
          const {done, value} = await mainReader.read();
          if (done) break;
          controller.enqueue(value);
        }

        controller.close();
      },
    });

    return combinedStream;
  }
);

    