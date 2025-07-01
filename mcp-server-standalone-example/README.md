# Example Standalone MCP Server (TypeScript)

This folder contains a simple, all-in-one Model Context Protocol (MCP) server built using the official [`@model-context-protocol/server`](https://github.com/model-context-protocol/typescript-sdk) TypeScript SDK.

This server is designed to be the simplest starting point for building your own custom MCP setup. It's completely standalone and does not require any external configuration files or orchestrators.

It provides two main features out-of-the-box:
-   **Ollama Provider**: It connects to your local Ollama instance and makes all of your local models available to any connected MCP client.
-   **`echo` Tool**: A simple tool that echoes back any message it receives.

## Prerequisites

-   **Node.js**: You'll need Node.js (v18 or later) installed.
-   **npm**: Comes with Node.js.
-   **Ollama**: You must have [Ollama](https://ollama.com/) installed and running locally for the model provider to work.

## How to Run This Server

1.  **Install dependencies**:
    In your terminal, navigate to this `mcp-server-standalone-example` directory and run:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` file in this directory by copying the `.env.example` file.
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file to make sure `OLLAMA_BASE_URL` points to your local Ollama instance (the default `http://localhost:11434` is usually correct).

3.  **Start the Server**:
    Run the following command to start the server:
    ```bash
    npm start
    ```

You should see a message indicating that the server has started successfully on port `8008`. At this point, you can connect to it from an MCP client like Chat Studio. In Chat Studio's settings, set the **Connection Mode** to **MCP** and ensure the base URL in `.env` (for the main app) is set to `http://localhost:8008`.

## Customizing the Server

This server is a template. You can easily customize it:
-   **Add Tools**: Create new tool files in `src/tools/` and add them to the `addTools()` method in `src/server.ts`.
-   **Add Providers**: If you want to connect to other model services, you can add more providers in the `addProviders()` method.
-   **Change Port**: You can change the port the server runs on by editing the `MCP_PORT` variable in your `.env` file.
