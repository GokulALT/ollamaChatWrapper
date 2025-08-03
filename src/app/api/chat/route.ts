
import {type NextRequest, NextResponse} from 'next/server';
import type {ChatMessage} from 'genkit';
import {run} from 'genkit/flow';
import {chat} from '@/ai/flows/chat';
import {ragFlow} from '@/ai/flows/rag-flow';
import type {ConnectionMode} from '@/types/chat';

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Unified chat endpoint for all connection modes.
 *     description: >
 *       This endpoint routes chat requests to the appropriate handler based on the
 *       `connectionMode` specified in the request body.
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectionMode
 *               - model
 *               - messages
 *             properties:
 *               connectionMode:
 *                 type: string
 *                 enum: [direct, mcp, rag]
 *                 description: The chat mode to use.
 *               model:
 *                 type: string
 *                 description: The ID of the model to use for the chat.
 *               messages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ChatMessage'
 *                 description: A list of messages comprising the conversation so far.
 *               systemPrompt:
 *                 type: string
 *                 description: An optional system prompt to guide the model's behavior.
 *               temperature:
 *                 type: number
 *                 description: Controls the randomness of the model's output.
 *               collection:
 *                 type: string
 *                 description: The name of the RAG collection to use (required for `rag` mode).
 *     responses:
 *       '200':
 *         description: A streaming response with the model's output.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "This is the AI's response."
 *       '400':
 *         description: Bad request, often due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - role
 *         - content
 *       properties:
 *         role:
 *           type: string
 *           enum: [system, user, assistant, tool]
 *         content:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: string
 */
export async function POST(req: NextRequest) {
  try {
    const {
      connectionMode,
      model,
      messages,
      systemPrompt,
      temperature,
      collection,
    } = (await req.json()) as {
      connectionMode: ConnectionMode;
      model: string;
      messages: ChatMessage[];
      systemPrompt?: string;
      temperature?: number;
      collection?: string;
    };

    // Basic validation
    if (!connectionMode || !model || !messages) {
      return NextResponse.json(
        {error: 'Missing required fields in request body'},
        {status: 400}
      );
    }

    let flowToRun;
    let flowInput: any = {
      model,
      history: messages,
      systemPrompt: systemPrompt,
      temperature: temperature,
    };

    if (connectionMode === 'rag') {
      if (!collection) {
        return NextResponse.json(
          {error: 'RAG mode requires a `collection` parameter.'},
          {status: 400}
        );
      }
      flowToRun = ragFlow;
      flowInput.collection = collection;
    } else {
      flowToRun = chat;
    }

    const {stream, response} = await run(flowToRun, flowInput);

    const outputStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          if (chunk.output) {
            controller.enqueue(encoder.encode(chunk.output as string));
          }
        }
        controller.close();
      },
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error in unified chat API route:', error);
    return NextResponse.json(
      {error: 'Failed to process chat request.', details: error.message},
      {status: 500}
    );
  }
}
