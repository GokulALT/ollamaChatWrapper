
import {type NextRequest, NextResponse} from 'next/server';
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import {handleMcpDirectChat} from '@/lib/chat/mcp-direct';
import {handleRagChat} from '@/lib/chat/rag';
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
 *                   $ref: '#/components/schemas/ChatCompletionMessageParam'
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
 *               enableReranking:
 *                 type: boolean
 *                 description: Whether to enable the re-ranking step in RAG mode.
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
 *     ChatCompletionMessageParam:
 *       type: object
 *       required:
 *         - role
 *         - content
 *       properties:
 *         role:
 *           type: string
 *           enum: [system, user, assistant]
 *         content:
 *           type: string
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
      enableReranking,
    } = (await req.json()) as {
      connectionMode: ConnectionMode;
      model: string;
      messages: ChatCompletionMessageParam[];
      systemPrompt?: string;
      temperature?: number;
      collection?: string;
      enableReranking?: boolean;
    };

    // Basic validation
    if (!connectionMode || !model || !messages) {
      return NextResponse.json(
        {error: 'Missing required fields in request body'},
        {status: 400}
      );
    }

    let responseStream: ReadableStream<Uint8Array>;

    switch (connectionMode) {
      case 'direct':
      case 'mcp':
        responseStream = await handleMcpDirectChat({
          req,
          model,
          messages,
          systemPrompt,
          temperature,
          connectionMode,
        });
        break;
      case 'rag':
        if (!collection) {
          return NextResponse.json(
            {error: 'RAG mode requires a `collection` parameter.'},
            {status: 400}
          );
        }
        responseStream = await handleRagChat({
          req,
          model,
          collection,
          messages,
          systemPrompt,
          temperature,
          enableReranking,
        });
        break;
      default:
        return NextResponse.json(
          {error: `Invalid connectionMode: ${connectionMode}`},
          {status: 400}
        );
    }

    return new Response(responseStream, {
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
