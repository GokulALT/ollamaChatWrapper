# Example MCP Tool Provider (TypeScript)

This folder contains a Model Context Protocol (MCP) **tool provider** server built using the official [`@model-context-protocol/server`](https://github.com/model-context-protocol/typescript-sdk) TypeScript SDK.

This server is designed to be launched as a child process by a main MCP host (like the pre-built `mcp-server` executable). It communicates over `stdio` and is responsible for providing a set of tools that the host can then expose to clients.

This example provides two tools:
-   **`echo`**: A simple tool that echoes back the message it receives.
-   **`filesystem`**: A powerful tool for reading, writing, and listing files on the local filesystem.

## Prerequisites

-   **Node.js**: You'll need Node.js (v18 or later) installed.
-   **npm**: Comes with Node.js.
-   **Main MCP Host**: You need a separate MCP host server to launch and manage this tool provider. For this, we recommend the [pre-built `mcp-server` executable](https://github.com/model-context-protocol/mcp-server/releases).

## How to Run This Tool Provider

You do not run this server directly. Instead, you configure your main MCP host to run it for you.

1.  **Install dependencies** for this tool provider:
    In your terminal, navigate to this `mcp-server-example` directory and run:
    ```bash
    npm install
    ```

2.  **Configure Your Main Host**:
    In the directory where you have your main `mcp-server` executable, create or edit your `mcp_config.json` file. Add an entry to launch this tool provider. The host needs to know how to start it.

    Here is an example `mcp_config.json` entry. It tells the main host to run `npm start` within the `mcp-server-example` directory.

    ```json
    {
      "mcpServers": {
        "my-typescript-tools": {
          "command": "npm",
          "args": [
            "start"
          ],
          "workingDir": "path/to/your/chat-studio/mcp-server-example"
        }
      }
    }
    ```
    **Important:** You must replace `"path/to/your/chat-studio/mcp-server-example"` with the actual absolute or relative path to this directory from where you are running the main host.

3.  **Run the Main Host**:
    Start your main `mcp-server` executable. It will read the config file, launch this TypeScript tool provider as a background process, and make its tools (`echo`, `filesystem`) available to any connected client, like Chat Studio.
