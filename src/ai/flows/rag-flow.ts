
'use server';
/**
 * @fileoverview A Genkit flow for performing Retrieval-Augmented Generation (RAG).
 * This flow retrieves relevant documents from a ChromaDB collection and uses them
 * to provide context to a language model for generating an answer.
 */
import {ai} from '@/ai/genkit';
import {generate, type ChatMessage} from 'genkit';
import {z} from 'zod';
import {ChromaClient, type ChromaClientParams} from 'chromadb';
import {getChromaUrl} from '@/lib/config';

// Define the tool for embedding text using a local Ollama model
const OllamaEmbeddingFunction = {
  async generate(texts: string[]): Promise<number[][]> {
    // Note: The embedding model is hardcoded for now, but could be configurable.
    const embeddingModel = 'nomic-embed-text';
    const embeddings: number[][] = [];
    for (const text of texts) {
      const response = await fetch(
        `${process.env.OLLAMA_BASE_URL}/api/embeddings`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({model: embeddingModel, prompt: text}),
        }
      );
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get embedding from Ollama: ${errorBody}`);
      }
      const data = await response.json();
      embeddings.push(data.embedding);
    }
    return embeddings;
  },
};

// Helper function to get ChromaClient with authentication support
function getChromaClient() {
  const chromaUrl = getChromaUrl();
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

const RagInputSchema = z.object({
  model: z.string(),
  history: z.array(z.any()),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  collection: z.string(),
});

// The output will be a string that contains the AI response and sources, separated by a special string.
const RagOutputSchema = z.string();

export const ragFlow = ai.defineFlow(
  {
    name: 'ragFlow',
    inputSchema: RagInputSchema,
    outputSchema: RagOutputSchema,
  },
  async ({model, history, systemPrompt, temperature, collection}) => {
    const userQuery =
      history.length > 0 ? history[history.length - 1].content[0].text : '';

    if (!userQuery) {
      throw new Error('No user query found in history.');
    }

    const chroma = getChromaClient();
    if (!chroma) {
      throw new Error('ChromaDB URL is not configured.');
    }

    const chromaCollection = await chroma.getCollection({
      name: collection,
      embeddingFunction: OllamaEmbeddingFunction,
    });

    const results = await chromaCollection.query({
      nResults: 10,
      queryTexts: [userQuery],
    });

    const sources =
      results.documents[0]?.map((doc, i) => ({
        pageContent: doc,
        metadata: results.metadatas?.[0]?.[i] || {},
      })) || [];

    const contextString = sources
      .map(
        (source, i) =>
          `Source ${i + 1} (from ${source.metadata.source || 'unknown'}):\n${
            source.pageContent
          }`
      )
      .join('\n\n---\n\n');

    const ragPrompt = `You are an expert AI assistant. Use the following context from retrieved documents to answer the user's question. The documents are from a collection named "${collection}".

Synthesize an answer based *only* on the provided context. If the context does not contain the answer, state that the information is not available in the documents. Do not use any outside knowledge.

## Context from Documents:
${contextString}

## User's Question:
${userQuery}

${systemPrompt ? `\n## Additional Instructions:\n${systemPrompt}` : ''}

## Answer:`;

    const response = await generate({
      model,
      prompt: ragPrompt,
      history: history.slice(0, -1) as ChatMessage[], // History without the last user message
      config: {
        temperature,
      },
    });

    const responseText = response.text;
    const sourcesJson = JSON.stringify(sources);

    // We send the sources back to the client by embedding them in the response string.
    return `${sourcesJson}_--_SEPARATOR_--_${responseText}`;
  }
);
