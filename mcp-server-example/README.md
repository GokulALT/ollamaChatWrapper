# Example MCP Server (TypeScript)

This folder contains a robust, example Model Context Protocol (MCP) server built using the official [`@model-context-protocol/server` TypeScript SDK](https://github.com/model-context-protocol/typescript-sdk). It's designed to be a fast and reliable starting point for creating your own custom MCP servers and integrating tools.

This server is pre-configured to:
- Connect to a local Ollama instance to provide language models.
- Include a simple `echo` tool as an example.

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

If successful, you will see a message like `MCP Server started successfully on http://localhost:8008`. You can now go back to the Chat Studio application, set the Connection Mode to "MCP Server", and start chatting.

## Configuration

Unlike the pre-built MCP server executables that use an `mcp_config.json` file, this TypeScript-based server is configured directly within the code. All settings, including the port, model providers, and tools, are managed in `src/server.ts`.

This approach offers greater flexibility and type safety. To make changes:
-   **Port**: Modify the `PORT` constant at the bottom of `src/server.ts`.
-   **Providers**: Add or remove providers in the `addProviders()` method.
-   **Tools**: Add or remove tools in the `addTools()` method (as shown in the guide below).

## How to Add a New Tool

The real power of MCP comes from adding your own tools. Here’s a step-by-step guide to adding a new `calculator` tool.

### Step 1: Create the Tool File

Create a new file inside the `src/tools/` directory. For this example, let's call it `calculator.ts`.

### Step 2: Define the Tool Logic

Open `src/tools/calculator.ts` and add the following code. We'll define the tool's specification, what input it expects (the schema), and the `execute` function that contains the tool's logic.

```typescript
// src/tools/calculator.ts

import { Tool } from '@model-context-protocol/server';

// Define the schema for the tool's input using JSON Schema format.
const CalculatorInputSchema = {
  type: 'object' as const,
  properties: {
    operation: { type: 'string' as const, enum: ['add', 'subtract', 'multiply', 'divide'] },
    a: { type: 'number' as const },
    b: { type: 'number' as const },
  },
  required: ['operation', 'a', 'b'],
};

// Define the schema for the tool's output.
const CalculatorOutputSchema = {
  type: 'object' as const,
  properties: {
    result: { type: 'number' as const },
  },
  required: ['result'],
};

// Create the tool instance.
export const calculatorTool = new Tool({
  // A unique name for your tool. This is used in the prompt.
  name: 'calculator',
  // A clear description that helps the language model understand what this tool does.
  description: 'A simple calculator that can add, subtract, multiply, or divide two numbers.',
  inputSchema: CalculatorInputSchema,
  outputSchema: CalculatorOutputSchema,

  // The core logic of the tool.
  async execute(input: { operation: string, a: number, b: number }) {
    let result: number;
    switch (input.operation) {
      case 'add':
        result = input.a + input.b;
        break;
      case 'subtract':
        result = input.a - input.b;
        break;
      case 'multiply':
        result = input.a * input.b;
        break;
      case 'divide':
        if (input.b === 0) {
            throw new Error("Cannot divide by zero.");
        }
        result = input.a / input.b;
        break;
      default:
        throw new Error(`Unknown operation: ${input.operation}`);
    }
    return { result };
  },
});
```

### Step 3: Register the Tool with the Server

Now, open `src/server.ts` and tell the MCP server about your new tool.

1.  **Import** the tool at the top of the file.
2.  **Add** the tool inside the `addTools` method using `this.server.addTool()`.

Your `src/server.ts` will now look like this:
```typescript
// src/server.ts (updated)
import { McpServer, OllamaProvider } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';
import { calculatorTool } from './tools/calculator'; // <-- 1. Import your new tool

/**
 * A robust, class-based implementation of an MCP server for Chat Studio.
 * This structure makes it easier to manage providers and tools as the
 * server grows in complexity.
 */
class ChatStudioMcpServer {
  // ... constructor and other methods remain the same

  /**
   * Registers the tools that the server will expose.
   * To add a new tool, import it and add it to this method.
   */
  private addTools(): void {
    // Add the built-in echo tool
    this.server.addTool(echoTool);
    console.log(`Tool added: ${echoTool.spec.name}`);
    
    // Add your new calculator tool
    this.server.addTool(calculatorTool); // <-- 2. Register your new tool
    console.log(`Tool added: ${calculatorTool.spec.name}`);
  }

  // ... other methods
}

// ... Initialization code remains the same
```

### Step 4: Restart and Use Your New Tool

1.  Stop the server if it's running (`Ctrl+C`).
2.  Restart it with `npm start`.
3.  Go to the Chat Studio application. In the sidebar, you should now see `calculator` listed under "Available Tools".
4.  Select a model and try a prompt that uses the tool, for example:

    `What is 125 divided by 5?`

The language model should understand the request, use your `calculator` tool, and give you the correct answer based on the tool's output.
