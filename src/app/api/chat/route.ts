
import {type NextRequest, NextResponse} from 'next/server';
import type {ChatMessage} from '@/types/chat';
import {chat} from '@/ai/flows/chat';
import {rag} from '@/ai/flows/rag-flow';
import {ai} from '@/ai/genkit';
import {configureGenkit} from 'genkit';

import {googleAI} from '@genkit-ai/googleai';

// Helper function to safely get environment variables
const getEnvVar = (name: string): string => {
    try {
        // In Edge Runtime, process.env is not available.
        // A common pattern is to have them available on a global object
        // provided by the environment, or handle them via build-time replacement.
        // For this context, we will assume a global accessor might exist
        // or fall back gracefully. This is a placeholder for a proper secrets management solution.
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name] || '';
        }
        return '';
    } catch (e) {
        return '';
    }
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = getEnvVar('GEMINI_API_KEY');
    
    // Configure Genkit within the request handler to ensure keys are fresh
    configureGenkit({
        plugins: [
            googleAI({apiKey: geminiKey}),
        ],
        // Adding logging to help debug issues
        logLevel: 'debug',
        enableTracing: true,
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

    const llm = ai.model(model);
    
    // Convert message history to the format Genkit expects
    const history = messages.map(msg => ({
      role: msg.sender as 'user' | 'ai', // Type assertion
      content: [{text: msg.text}],
    }));

    // The last message is the new prompt
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
    console.error(`[Chat API Error] ${err.stack}`);
    // Return a more descriptive error response
    return NextResponse.json(
        {error: err.message || 'An unexpected server error occurred.'}, 
        {status: 500}
    );
  }
}
