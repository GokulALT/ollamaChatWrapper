
import {type NextRequest, NextResponse} from 'next/server';
import type {ChatMessage} from '@/types/chat';
import {chat} from '@/ai/flows/chat';
import {rag} from '@/ai/flows/rag-flow';
import {ai} from '@/ai/genkit';
import {configureGenkit} from 'genkit';

import {anthropic} from '@genkit-ai/anthropic';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from '@genkit-ai/openai';

export async function POST(req: NextRequest) {
  let geminiKey = '';
  let anthropicKey = '';
  let openaiKey = '';
  try {
    geminiKey = process.env.GEMINI_API_KEY || '';
    anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    openaiKey = process.env.OPENAI_API_KEY || '';
  } catch (e) {
    // probably running in a browser
  }

  // Note: Next.js edge runtime doesn't support `process.env`.
  // We workaround this by reading the headers passed from the client.
  // This is a temporary solution until we can securely manage API keys on the server.
  configureGenkit({
    plugins: [
      googleAI({apiKey: geminiKey}),
      anthropic({apiKey: anthropicKey}),
      openai({apiKey: openaiKey}),
    ],
  });

  const {
    connectionMode,
    model,
    messages,
    systemPrompt,
    temperature,
    collection,
    enableReranking,
  } = (await req.json()) as {
    connectionMode: 'direct' | 'rag';
    model: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    collection?: string;
    enableReranking?: boolean;
  };

  let responseStream: ReadableStream<any>;

  try {
    const llm = ai.model(model);
    const history = messages.map(msg => ({
      role: msg.sender,
      content: [{text: msg.text}],
    }));
    // Remove the latest message from history and use it as the prompt.
    const prompt = history.pop()!.content;

    if (connectionMode === 'rag') {
      if (!collection) {
        throw new Error('RAG mode requires a `collection` parameter.');
      }
      responseStream = await rag.stream({
        prompt: prompt,
        history: history,
        llm,
        collection,
        systemPrompt,
        temperature,
        ollamaHost: req.headers.get('X-Ollama-Url')!,
        chromaHost: req.headers.get('X-Chroma-Url')!,
        enableReranking: enableReranking ?? true,
      });
    } else {
      responseStream = await chat.stream({
        prompt: prompt,
        history: history,
        llm,
        systemPrompt,
        temperature,
      });
    }

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message}, {status: 500});
  }
}

    