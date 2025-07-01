# Example MCP Tool Server (TypeScript)

This folder contains a robust example of a Model Context Protocol (MCP) **tool server** built using the official [`@model-context-protocol/server`](https://github.com/model-context-protocol/typescript-sdk) TypeScript SDK.

It has been configured to run as a managed process that communicates over **stdio** (standard input/output). This means it does **not** open an HTTP port. Instead, it's designed to be launched and managed by a primary MCP host server (like the pre-built `mcp-server` executable).

This server is pre-configured to provide:
- A simple `echo` tool.
- A powerful `filesystem` tool for local file operations.

## Prerequisites

- **Node.js**: You'll need Node.js (v18 or later) installed.
- **npm**: Comes with Node.js.
- **MCP Server Executable**: You need the [pre-built `mcp-server`](https://github.com/model-context-protocol/mcp/releases) executable to act as the host.

## How to Run This Tool Server

You do **not** run this server directly and connect to it from Chat Studio. Instead, you configure your main `mcp-server` executable to run it for you.

### 1. Install Dependencies

First, navigate to this directory and install its Node.js dependencies:
```bash
cd mcp-server-example
npm install
```

### 2. Configure the Main MCP Host

Next, create or edit an `mcp_config.json` file for your main `mcp-server` executable. Add an entry in the `tools` array to tell the host how to run this server.

Here is an example `mcp_config.json` entry:
```json
{
  "listen": "localhost:8008",
  "providers": [
    {
      "path": "./provider-ollama.exe",
      "listen": "tcp"
    }
  ],
  "tools": [
    {
      "name": "custom-ts-server",
      "command": "npm",
      "args": ["start"],
      "listen": "stdio",
      "cwd": "./mcp-server-example"
    }
  ]
}
```
**Key Configuration Details:**
-   `"name"`: A name for your tool server, e.g., `custom-ts-server`. The tools it exposes (`filesystem`, `echo`) will be available under this scope.
-   `"command"`: The command to run. We use `npm`.
-   `"args"`: The arguments for the command. `["start"]` will execute the `npm start` script from this folder's `package.json`.
-   `"listen": "stdio"`: This is the crucial part. It tells the host to communicate with this process using stdin/stdout, not a network port.
-   `"cwd"`: The working directory from which to run the command. This should point to the `mcp-server-example` directory.

### 3. Run the Main MCP Host

Finally, run your main `mcp-server` from the directory containing your config file:

```bash
./mcp-server --config mcp_config.json
```

The host server will start, launch this TypeScript tool server as a child process, and make its tools available to any connected client, like Chat Studio.
