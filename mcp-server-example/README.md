# Example MCP Server (TypeScript)

This folder contains a robust, example Model Context Protocol (MCP) server built using the official [`@model-context-protocol/server` TypeScript SDK](https://github.com/model-context-protocol/typescript-sdk). It's designed to be a fast and reliable starting point for creating your own custom MCP servers and integrating tools.

This server is pre-configured to:
- Connect to a local Ollama instance to provide language models.
- Include a simple `echo` tool as a basic example.
- Include a powerful `filesystem` tool to read, write, and list local files.

## Prerequisites

1.  **Node.js**: You'll need Node.js (v18 or later) installed.
2.  **npm**: Comes with Node.js.
3.  **Ollama**: You must have [Ollama](https://ollama.com/) installed and running with at least one model (e.g., `ollama run llama3`). The server will connect to it automatically.

## Setup and Running

1.  **Navigate to this directory**:
    ```bash
    cd mcp-server-example
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the server**:
    ```bash
    npm start
    ```

If successful, you will see a message like `MCP Server started successfully on http://localhost:8008`. You can now go back to the Chat Studio application, set the Connection Mode to "MCP Server", and start chatting. The `filesystem` tool will be available.

## Configuration

Unlike the pre-built MCP server executables that use an `mcp_config.json` file, this TypeScript-based server is configured directly within the code. All settings, including the port, model providers, and tools, are managed in `src/server.ts`.

This approach offers greater flexibility and type safety. To make changes:
-   **Port**: Modify the `PORT` constant at the bottom of `src/server.ts`.
-   **Providers**: Add or remove providers in the `addProviders()` method.
-   **Tools**: Add or remove tools in the `addTools()` method (as shown in the guide below).

## How to Add a New Tool

The real power of MCP comes from adding your own tools. This server includes a `filesystem` tool as a powerful, real-world example. Here’s a breakdown of how it was built, which you can use as a guide for your own tools.

### Step 1: Create the Tool File

A new file was created at `src/tools/filesystem.ts`.

### Step 2: Define the Tool Logic

In `src/tools/filesystem.ts`, we use Node.js's built-in `fs/promises` and `path` modules to interact with the file system.

```typescript
// src/tools/filesystem.ts (Simplified)

import { Tool } from '@model-context-protocol/server';
import fs from 'fs/promises';
import path from 'path';

// Define the schema for the tool's input.
const FilesystemInputSchema = {
  type: 'object' as const,
  properties: {
    operation: { type: 'string' as const, enum: ['readFile', 'writeFile', 'listFiles'] },
    path: { type: 'string' as const, description: 'The path to the file or directory.' },
    // ... other properties
  },
  required: ['operation', 'path'],
};

// Define the schema for the tool's output.
const FilesystemOutputSchema = {
  // ... schema definition
};

// Create the tool instance.
export const filesystemTool = new Tool({
  name: 'filesystem',
  description: 'Performs file system operations like reading, writing, and listing files.',
  inputSchema: FilesystemInputSchema,
  outputSchema: FilesystemOutputSchema,

  // The core logic of the tool.
  async execute(input: { operation: string, path: string, content?: string }) {
    // IMPORTANT: Security checks are included to prevent path traversal attacks.
    // ...
    
    // Logic to handle readFile, writeFile, and listFiles
    // ...
    
    return { /* result */ };
  },
});
```

### Step 3: Register the Tool with the Server

In `src/server.ts`, the new tool is imported and registered with the server instance.

```typescript
// src/server.ts (updated)
import { McpServer, OllamaProvider } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';
import { filesystemTool } from './tools/filesystem'; // <-- 1. Import the new tool

class ChatStudioMcpServer {
  // ... constructor and other methods

  private addTools(): void {
    this.server.addTool(echoTool);
    console.log(`Tool added: ${echoTool.spec.name}`);
    
    // Register the filesystem tool
    this.server.addTool(filesystemTool); // <-- 2. Register the tool
    console.log(`Tool added: ${filesystemTool.spec.name}`);
  }

  // ... other methods
}

// ... Initialization code
```

### Step 4: Restart and Use the Filesystem Tool

1.  Stop the server if it's running (`Ctrl+C`).
2.  Restart it with `npm start`.
3.  Go to the Chat Studio application. In the sidebar, you should now see `filesystem` listed under "Available Tools".
4.  Select a model and try a prompt that uses the tool, for example:

    `Using the filesystem tool, list all files in the current directory.`

The language model should understand the request, use your `filesystem` tool, and give you the correct output. You can also ask it to read from or write to files.
