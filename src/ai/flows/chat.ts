'use server';
/**
 * @fileoverview A universal chat flow that can interact with any configured Genkit model.
 * It supports chat history, system prompts, and temperature control.
 */
import {ai} from '@/ai/genkit';
import {generate, type ChatMessage, type GenerateOptions} from 'genkit';
import {z} from 'zod';

export const chat = ai.defineFlow(
  {
    name: 'chat',
    inputSchema: z.object({
      model: z.string(),
      history: z.array(z.any()), // Using z.any() for simplicity to match Genkit's ChatMessage type
      systemPrompt: z.string().optional(),
      temperature: z.number().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({model, history, systemPrompt, temperature}) => {
    const options: GenerateOptions = {
      model,
      history: history as ChatMessage[],
      config: {
        temperature,
      },
    };

    if (systemPrompt) {
      options.prompt = systemPrompt;
    }

    const response = await generate(options);
    return response.text;
  }
);
