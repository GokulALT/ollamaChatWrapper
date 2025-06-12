'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a title for a chat session based on the conversation history.
 *
 * - generateChatTitle - A function that triggers the chat title generation flow.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function, which includes the chat history.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function, which is the generated title.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatTitleInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The complete chat history of the session.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the chat session.'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: {schema: GenerateChatTitleInputSchema},
  output: {schema: GenerateChatTitleOutputSchema},
  prompt: `You are an expert at creating titles for chat sessions.

  Based on the following chat history, create a concise and descriptive title for the chat session.

  Chat History:
  {{chatHistory}}

  Title: `,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
