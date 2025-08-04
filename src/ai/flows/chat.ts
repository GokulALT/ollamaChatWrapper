'use server';

import {ai} from '@/ai/genkit';
import {GenerateRequest, MessageData, generate} from 'genkit/ai';
import {z} from 'zod';

const ChatRequestSchema = z.object({
  prompt: z.array(z.any()),
  history: z.array(z.any()),
  llm: z.any(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
});

export const chat = ai.flow(
  {
    name: 'chat',
    inputSchema: ChatRequestSchema,
    outputSchema: z.string(),
  },
  async request => {
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

    // Augment with system prompt if provided
    if (request.systemPrompt) {
        generateRequest.messages = [
            {role: 'system', content: [{text: request.systemPrompt}]}
        ]
    }

    const {stream, response} = await generate(generateRequest);

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const data = chunk.content;
        controller.enqueue(data);
      },
    });

    return stream().pipeThrough(transformStream);
  }
);
