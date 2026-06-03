# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Turbopack, port 9002)
npm run dev

# Production build
npm run build

# Type checking (no emit)
npm run typecheck

# Lint
npm run lint

# MCP server examples (run from their own directories)
cd mcp-server-example && npm run dev
cd mcp-server-standalone-example && npm run dev
```

There is no test framework configured — no Jest, Vitest, or test scripts exist.

## Architecture

Chat Studio is a Next.js 15 app router application that provides a chat UI supporting three connection modes:

- **Direct** — talks to a local Ollama instance at `http://localhost:11434` using Ollama's native API
- **MCP** — talks to an MCP-compatible HTTP server at `http://localhost:8008` using an OpenAI-compatible streaming API
- **RAG** — uses Ollama for LLM + ChromaDB at `http://localhost:8000` for vector retrieval

### API Routes (`src/app/api/`)

| Route | Purpose |
|---|---|
| `ollama/chat` | Streams chat; handles both Ollama native and OpenAI-compatible SSE formats |
| `ollama/models` | Lists available models (direct or MCP mode) |
| `ollama/status` | Connectivity health check |
| `ollama/pull` | Downloads a model from Ollama registry |
| `ollama/delete` | Removes a model |
| `rag/chat` | RAG pipeline: embeds query → ChromaDB retrieval → LLM with context |
| `rag/upload` | Chunks and embeds documents (.txt / .docx via Mammoth) into ChromaDB |
| `rag/collections` | CRUD for ChromaDB collections |
| `rag/status` | ChromaDB connectivity check |

### RAG Data Flow

1. Upload: document → chunked (1000 chars, 200 overlap) → `nomic-embed-text` via Ollama → ChromaDB collection
2. Query: user message → embedded → ChromaDB similarity search → top-k context → sent with chat history to LLM

### Key Source Files

- `src/app/page.tsx` — main chat UI with sidebar, model/collection selectors, connection mode switcher
- `src/app/settings/page.tsx` — settings tabs (General, Direct Mode, RAG, System Prompt); model pull/delete manager
- `src/components/chat-window.tsx` — message list, streaming response rendering
- `src/lib/config.ts` — all localStorage read/write for URLs, settings, system prompt
- `src/types/chat.ts` — shared TypeScript types: `ConnectionMode`, `ChatMessageData`, `Source`

### MCP Server Examples

Two standalone packages (each with their own `package.json` and `tsconfig.json`):

- `mcp-server-example/` — stdio transport MCP server with filesystem and echo tools
- `mcp-server-standalone-example/` — HTTP transport server that bundles an Ollama provider and echo tool; designed to be pointed at by Chat Studio's MCP mode

### Configuration & Persistence

- User settings (Ollama URL, ChromaDB URL, MCP URL, system prompt) are stored in **localStorage** via `src/lib/config.ts`
- Environment variables for ChromaDB auth: `CHROMA_AUTH_METHOD`, `CHROMA_TOKEN`, `CHROMA_USERNAME`, `CHROMA_PASSWORD`
- Optional `OLLAMA_BASE_URL` env var overrides the default `http://localhost:11434`
- `next.config.ts` intentionally ignores TypeScript and ESLint errors during `next build`

### Styling

- Tailwind CSS with an extensive CSS variable color system defined in `src/app/globals.css` and `tailwind.config.ts`
- Dark mode via `class` strategy (toggled by `theme-provider.tsx`)
- ShadCN UI components live in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Path alias `@/*` maps to `src/*`
