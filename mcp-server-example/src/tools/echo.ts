import { Tool } from '@model-context-protocol/server';

// Define the schema for the tool's input
const EchoInputSchema = {
  type: 'object' as const,
  properties: {
    message: { type: 'string' as const },
  },
  required: ['message'],
};

// Define the schema for the tool's output
const EchoOutputSchema = {
  type: 'object' as const,
  properties: {
    response: { type: 'string' as const },
  },
  required: ['response'],
};

// Create the tool
export const echoTool = new Tool({
  name: 'echo',
  description: 'A simple tool that echoes back the message it receives.',
  inputSchema: EchoInputSchema,
  outputSchema: EchoOutputSchema,
  async execute(input: { message: string }) {
    return {
      response: `You said: ${input.message}`,
    };
  },
});
