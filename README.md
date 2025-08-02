
# Chat Studio - Your AI Assistant and MCP Client

This is Chat Studio, a Next.js application that serves as a powerful **MCP Client**. It acts as an AI assistant that communicates with **Model Context Protocol (MCP)** servers, allowing language models to be augmented with specialized tools and data sources. This turns a simple chat into a powerful, context-aware conversation. The application features a clean user interface built with ShadCN UI components and Tailwind CSS.

## The Model Context Protocol (MCP)

The Model Context Protocol (MCP) employs a client-host-server architecture to enable AI models to interact with various tools and data sources. It standardizes communication between AI applications and external systems, akin to how USB-C connects devices to peripherals.

Here's a breakdown of the key components:

### 1. Host (Client Application)

- This is the AI-powered application. **Chat Studio is a ready-to-use example of a Host application.**
- It houses the MCP Client, responsible for capturing user intent and refining it into a query.
- The MCP Client acts as an interface, managing connections to MCP servers and handling security.
- It can connect to multiple MCP servers, each exposing different tools or resources.

### 2. Server

- MCP servers are the integration and execution layer, connecting to various data sources (local or remote).
- They receive requests from the client, interface with external tools (APIs, databases, etc.), and structure the retrieved data.
- The server then returns structured responses that the AI model can understand and process.
- Servers provide context and tools to the clients, maintaining a stateful connection over a session.

### 3. Protocol

- MCP uses JSON-RPC as its foundation, providing a standardized way to exchange messages between clients and servers.
- The protocol handles the details of communication, like formatting messages, managing IDs, and error handling.
- This ensures that both the client and server stay synchronized and can interpret each other's messages correctly.

### 4. Data Flow

- MCP enables bidirectional data flow between AI models and external systems.
- This allows AI models to be interactive and aware of their surroundings, facilitating more nuanced and functional applications.

### 5. Key Benefits

-   **Standardization:** MCP provides a common interface for AI models to interact with different tools and data sources.
-   **Extensibility:** The architecture allows for easy addition of new tools and data sources to the ecosystem.
-   **Scalability:** MCP enables distributed and dynamic tool deployment and discovery.
-   **Security:** MCP maintains clear security boundaries and isolates concerns between different components.

In essence, MCP acts as a bridge, connecting AI models to the vast resources available in the real world, making them more powerful and versatile.

## Features

*   **AI Assistant Interface**: Engage in conversations with your selected language model.
*   **Multiple Connection Modes**:
    *   **Direct Mode**: Connect directly to a local Ollama instance for simple chat.
    *   **MCP Mode**: Connect to an MCP server to leverage specialized tools.
    *   **RAG Mode**: Chat with your own documents using a local vector database.
*   **Connection Management**: Configure your Ollama, MCP, and ChromaDB server URLs directly in the UI settings.
*   **RAG (Retrieval-Augmented Generation)**: Upload `.txt` and `.docx` documents to a ChromaDB collection. Chat Studio will use these documents to provide context-aware answers.
*   **MCP Tool Support**: In MCP mode, leverage any tool configured on your server (e.g., `filesystem` to analyze local files).
*   **Model & Collection Selection**: Dynamically select AI models, and in RAG mode, choose your document collection from the sidebar.
*   **Transparent Context**: In RAG mode, see exactly which document sources were used to generate an answer.
*   **New Chat Session**: Easily clear the current conversation and start a new one.
*   **Live Status Indicators**: See the connectivity status for your Ollama, MCP, and ChromaDB servers.
*   **System Prompts**: Configure a system-wide prompt to guide the behavior of your models.
*   **Dark Mode**: Includes a theme toggle for light and dark modes.

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Ollama](https://ollama.com/) installed and running with at least one model pulled (e.g., `ollama run llama3`).
*   [Docker](https://www.docker.com/products/docker-desktop/) (Recommended for running ChromaDB in RAG mode).

## Setting Up a Local MCP Server

Chat Studio is an MCP Client. To use its full potential (including tools), you'll need to run an MCP server locally. This project includes two example TypeScript servers to demonstrate two different architectural approaches.

### Understanding the Two Example Servers

1.  **Standalone Server (`mcp-server-standalone-example`)**:
    *   **Purpose**: A simple, all-in-one server perfect for getting started quickly.
    *   **Transport**: Uses `HttpServerTransport` to run on a network port (e.g., `http://localhost:8008`).
    *   **How it Works**: You run it directly, and it provides both Ollama models and a simple `echo` tool in a single process. It does **not** use a config file. This is the easiest way to start with MCP.

2.  **Orchestrated Tool Provider (`mcp-server-example`)**:
    *   **Purpose**: A more advanced server designed to be a "tool" launched by a main orchestrator.
    *   **Transport**: Uses `StdioServerTransport` to communicate with a parent process over standard I/O.
    *   **How it Works**: You do **not** run this server directly. Instead, you run the pre-built `mcp-server` executable, which reads an `mcp_config.json` file and launches this server as a background process. This is the standard architecture for managing multiple tools, especially those written in different languages.

---

### Option 1: Run the Simple Standalone Server (Recommended for most users)

The `mcp-server-standalone-example` folder contains a ready-to-run, all-in-one MCP server. It's the perfect starting point and is configured to:
- Connect to your local **Ollama** instance.
- Provide a simple `echo` tool.
- Run on its own without needing any external configuration files.

For detailed instructions, please see the [**README in that folder**](./mcp-server-standalone-example/README.md).

### Option 2: Run an Orchestrated Server with a Config File (Advanced)

For advanced use cases, such as orchestrating multiple tool processes written in different languages, you should use the pre-built `mcp-server` executable. This acts as a central **host** that launches and manages other tool servers based on a configuration file. The `mcp-server-example` in this project is designed to be one of these tools.

#### Step 1: Get the Host Executable
Download the `mcp-server` executable for your operating system from the [**official MCP GitHub Releases**](https://github.com/model-context-protocol/mcp-server/releases). Place it in a convenient directory.

#### Step 2: Create a Configuration File
In the same directory as the executable, create a file named `mcp_config.json`. This file tells the host which tools to launch. Below are two examples.

**Example A: Launching the TypeScript Tool**

This is the simplest config to get started. It tells the host to launch the `mcp-server-example` from this project, which provides the `filesystem` and `echo` tools.

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
**Important:** You must replace `"path/to/your/chat-studio/mcp-server-example"` with the correct absolute or relative path to that directory on your machine.

**Example B: Launching a Python Tool**

This example shows how to launch an external `stdio` tool, such as a Python script. This is the correct way to connect Chat Studio to a `stdio`-based server.

```json
{
  "mcpServers": {
    "my-python-tools": {
      "command": "python3",
      "args": [
        "/path/to/your/python_mcp_server.py",
        "--config",
        "/path/to/your/python_config.json"
      ],
      "workingDir": "/path/to/your/python_project"
    }
  }
}
```
*   `command`: The program to run (e.g., `python3`, `node`, or an executable).
*   `args`: A list of arguments to pass to the command.
*   `workingDir`: The directory to run the command in.

#### Step 3: Run the Host Server
Open a terminal, navigate to the directory containing your executable and `mcp_config.json` file, and run:
```bash
./mcp-server
```
The host server will start, launch the tools defined in your config, and be ready to accept connections from Chat Studio on its default port. For more details, refer to the [official MCP Quickstart](https://modelcontextprotocol.io/quickstart/user).

---

## Getting Started with Chat Studio

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Connection Endpoints:**
    All connection settings are managed in the UI. Go to **Settings -> General** to configure the URLs for:
    - Ollama (for Direct and RAG modes)
    - MCP Server
    - ChromaDB (for RAG mode)
    These settings are saved locally in your browser. The `.env` file is only used for optional ChromaDB authentication.


4.  **Optional: Configure Environment Variables:**
    Create a `.env` file in the root of your project if you need to connect to a secured ChromaDB instance.

    ```env
    # --- Optional: ChromaDB Authentication ---
    # Set the method and credentials if your ChromaDB requires a login.
    # CHROMA_AUTH_METHOD= # 'token' or 'basic'
    # CHROMA_TOKEN=
    # CHROMA_USERNAME=
    # CHROMA_PASSWORD=
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

6.  **Open your browser**, navigate to the application URL, and configure your endpoints in the settings.

## Using RAG (Retrieval-Augmented Generation) Mode

In addition to the standard chat modes, Chat Studio includes a powerful RAG mode that allows you to chat with your own documents.

### How it Works

1.  **Upload**: You upload `.txt` or `.docx` files to a "collection" in the RAG settings.
2.  **Embed**: Chat Studio chunks the text, converts it into numerical representations (embeddings) using a local Ollama model (`nomic-embed-text`), and stores them in a ChromaDB vector database.
3.  **Retrieve**: When you ask a question, the app embeds your query and searches ChromaDB for a set of potentially relevant text chunks.
4.  **Re-rank**: The app then uses your selected language model to analyze the retrieved chunks and re-rank them based on their direct relevance to your question.
5.  **Generate**: The most relevant, re-ranked context is then passed to the language model along with your question, allowing the AI to generate an answer based on the most accurate information.

### RAG Data Flow Diagram

Here is a more detailed breakdown of the RAG system's architecture.

**Part 1: Document Ingestion**
```
[User] --(Uploads file.txt)--> [Chat Studio UI]
   |
   v
[Next.js API: /api/rag/upload]
   |
   +--> 1. Extract Text from file
   |
   +--> 2. Chunk Text into pieces
   |
   +--> 3. For each chunk:
   |      |
   |      '-- (Request Embedding) --> [Ollama: nomic-embed-text]
   |                                      |
   |      '<-----------------------------'  (Receive Vector)
   |
   +--> 4. Store (Vector + Text Chunk) --> [ChromaDB]
```

**Part 2: Query and Generation**
```
[User] --(Asks "What is X?")--> [Chat Studio UI]
   |
   v
[Next.js API: /api/rag/chat]
   |
   +--> 1. Embed User's Question --> [Ollama: nomic-embed-text]
   |
   +--> 2. Query ChromaDB for initial docs --> [ChromaDB]
   |
   +--> 3. Re-rank docs for relevance --> [Ollama: LLM (e.g., llama3)]
   |
   +--> 4. Construct Final Prompt with re-ranked context
   |
   +--> 5. Send Final Prompt --> [Ollama: LLM (e.g., llama3)]
   |                                |
   |      '<-----------------------'  (Receive AI-generated Answer)
   |
   v
[Chat Studio UI] --(Displays Answer & Sources)--> [User]
```

### Prerequisites for RAG

For RAG mode to function, you need to have **ChromaDB** running locally, in addition to Ollama. The easiest way to run ChromaDB is with Docker.

1.  **Install Docker**: If you don't have it, install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

2.  **Run ChromaDB**: Open your terminal and run the following command to start an unsecured ChromaDB instance:
    ```bash
    docker run -p 8000:8000 ghcr.io/chroma-core/chroma
    ```
    This will download the ChromaDB image and start it on `localhost:8000`. You can then enter this URL in the Chat Studio settings.

### Connecting to a Secured ChromaDB

If your ChromaDB instance requires authentication, you can configure the credentials in your `.env` file. Chat Studio supports both token (bearer) and basic authentication.

**For token authentication:**
```env
CHROMA_AUTH_METHOD=token
CHROMA_TOKEN=your_bearer_token_here
```

**For basic authentication:**
```env
CHROMA_AUTH_METHOD=basic
CHROMA_USERNAME=your_username
CHROMA_PASSWORD=your_password
```

### Using RAG in Chat Studio

1.  In the Chat Studio settings, switch the **Connection Mode** to **RAG**.
2.  Open the settings again and go to the **RAG** tab.
3.  **Create a collection** to hold your documents.
4.  **Upload** one or more `.txt` or `.docx` files to your new collection.
5.  Return to the main chat screen.
6.  Select your **collection** and an **AI model** from the sidebar.
7.  You can now start asking questions about your documents!

## API Documentation

This project exposes a comprehensive set of REST APIs for external integrations. For detailed information on the available endpoints, request/response formats, and required headers, please see the dedicated **[API Documentation](./API.md)**.

---

## Project Structure

*   `src/app/`: Contains the Next.js pages and API routes.
    *   `src/app/page.tsx`: The main page component for the chat interface.
    *   `src/app/api/chat`: The unified API route for all chat operations.
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/chat-window.tsx`: The main chat interface component.
    *   `src/components/model-selector.tsx`: Component for selecting models.
    *   `src/components/ollama-status.tsx`: Component for displaying MCP server status.
*   `mcp-server-example/`: An advanced, stdio-based MCP tool provider built with TypeScript.
*   `mcp-server-standalone-example/`: A simple, all-in-one MCP server built with TypeScript.
*   `src/lib/`: Utility functions and core logic.
    * `src/lib/chat`: Contains the core logic for handling different chat modes.
*   `src/types/`: TypeScript type definitions.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/)
*   **Backend Protocol**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
*   **Vector Database**: [ChromaDB](https://www.trychroma.com/)
*   **UI Library**: [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)

This project was initialized and developed with the assistance of Firebase Studio.
