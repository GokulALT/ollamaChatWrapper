# Example MCP Server (TypeScript)

This folder contains a standalone Model Context Protocol (MCP) **server** built using the official [`@model-context-protocol/server`](https://github.com/model-context-protocol/typescript-sdk) TypeScript SDK.

This is an all-in-one server that:
- Connects to a local **Ollama** instance to provide language models.
- Exposes useful tools, including a simple `echo` tool and a powerful `filesystem` tool.
- Runs on its own HTTP port (defaulting to `localhost:8008`).

This is the recommended way to get started with MCP mode in Chat Studio. You do not need any other executables or configuration files to run it.

## Prerequisites

- **Node.js**: You'll need Node.js (v18 or later) installed.
- **npm**: Comes with Node.js.
- **Ollama**: Make sure you have [Ollama](https://ollama.com/) running with at least one model pulled (e.g., `ollama run llama3`).

## How to Run This Server

1.  **Navigate to this directory** in your terminal:
    ```bash
    cd mcp-server-example
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the server**:
    ```bash
    npm start
    ```

If successful, you will see a message confirming that the server is running on `http://localhost:8008`.

You can now go back to the Chat Studio application, open the settings, change the **Connection Mode** to **MCP**, and it should connect to this server automatically.
