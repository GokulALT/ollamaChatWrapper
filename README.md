
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

Chat Studio is an MCP Client. To use its full potential (including tools), you'll need to run an MCP server locally. This server acts as a bridge between Chat Studio and your models/tools.

You have two main options for running an MCP server:

### Option 1: Use the Pre-built Executables (Recommended for External Tools)

This is the best approach if you want to **orchestrate multiple, separate tool processes**, especially if they are written in different languages (like Python) or are standalone executables. This method uses an `mcp_config.json` file to manage everything.

For detailed instructions, always refer to the [official MCP Quickstart](https://modelcontextprotocol.io/quickstart/user).

#### 1. Download MCP Components

You'll need at least two executables from the [MCP Releases page on GitHub](https://github.com/model-context-protocol/mcp/releases):

*   **The MCP Server**: The core engine that reads your config file (e.g., `mcp-server.exe` on Windows).
*   **A Model Provider**: Connects to your language models (e.g., `provider-ollama.exe`).
*   **(Optional) Tools**: To add capabilities, download or create tool servers like `server-filesystem.exe` or your own Python scripts.

Download the latest executables for your operating system and place them all in the **same directory**.

#### 2. Create a Configuration File

In the same directory, create a file named `mcp_config.json`. This file tells the MCP server which models and tools to launch and manage.

Here is a sample configuration that enables the Ollama provider and the filesystem tool:

```json
{
  "listen": "localhost:8008",
  "providers": [
    {
      "path": "./provider-ollama",
      "listen": "tcp"
    }
  ],
  "tools": [
    {
      "name": "filesystem",
      "path": "./server-filesystem",
      "listen": "tcp"
    }
  ]
}
```
*Note: On Windows, you might need to add the `.exe` extension to the paths (e.g., `"./provider-ollama.exe"`).*

#### 3. Run the MCP Server

Open a terminal or command prompt, navigate to your directory, and run the server:

```bash
# On Linux/macOS
./mcp-server --config mcp_config.json

# On Windows
./mcp-server.exe --config mcp_config.json
```

If successful, you'll see log messages indicating the server is running on `localhost:8008`.

### Option 2: Use the Included TypeScript Example Server (For Custom, In-Process Tools)

This project includes a ready-to-run example server in the `mcp-server-example` folder. It's a great starting point if you want to build your own tools **directly within a Node.js environment using TypeScript**.

-   **No `mcp_config.json`**: This server is configured programmatically inside `src/server.ts`.
-   **In-Process Tools**: Tools like `filesystem` are built with Node.js and run inside the same process as the server.

See the [**README in that folder**](./mcp-server-example/README.md) for setup instructions.

## Getting Started with Chat Studio

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project by copying the provided template, and adjust the values as needed.

    ```env
    # In Direct/RAG mode, use your Ollama URL (e.g., http://localhost:11434).
    # In MCP mode, use your MCP server URL (e.g., http://localhost:8008).
    OLLAMA_BASE_URL=http://localhost:11434

    # The URL for your ChromaDB server, used in RAG mode.
    CHROMA_URL=http://localhost:8000

    # --- Optional: ChromaDB Authentication ---
    # Set the method and credentials if your ChromaDB requires a login.
    # CHROMA_AUTH_METHOD= # 'token' or 'basic'
    # CHROMA_TOKEN=
    # CHROMA_USERNAME=
    # CHROMA_PASSWORD=
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

5.  **Open your browser** and navigate to the application URL. You can select a connection mode in the settings.

## Using RAG (Retrieval-Augmented Generation) Mode

In addition to the standard chat modes, Chat Studio includes a powerful RAG mode that allows you to chat with your own documents.

### How it Works

1.  **Upload**: You upload `.txt` or `.docx` files to a "collection" in the RAG settings.
2.  **Embed**: Chat Studio chunks the text, converts it into numerical representations (embeddings) using a local Ollama model (`nomic-embed-text`), and stores them in a ChromaDB vector database.
3.  **Retrieve**: When you ask a question, the app embeds your query and searches ChromaDB for the most relevant chunks of text from your documents.
4.  **Generate**: This retrieved context is then passed to your selected language model along with your question, allowing the AI to generate an answer based on the content of your documents.

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
   +--> 1. Embed User's Question
   |      |
   |      '-- (Request Embedding) --> [Ollama: nomic-embed-text]
   |                                      |
   |      '<-----------------------------'  (Receive Query Vector)
   |
   +--> 2. Query ChromaDB with Vector --> [ChromaDB]
   |                                        |
   |      '<-------------------------------'  (Receive Relevant Context Chunks)
   |
   +--> 3. Construct Final Prompt:
   |      (System Instructions + Context Chunks + Conversation History)
   |
   +--> 4. Send Final Prompt --> [Ollama: LLM (e.g., llama3)]
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
    This will download the ChromaDB image and start it on `localhost:8000`, which is where Chat Studio expects to find it by default.

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

## Project Structure

*   `src/app/`: Contains the Next.js pages and API routes.
    *   `src/app/page.tsx`: The main page component for the chat interface.
    *   `src/app/api/ollama/`: API routes for interacting with the MCP server (fetching models, chat, status).
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/chat-window.tsx`: The main chat interface component.
    *   `src/components/model-selector.tsx`: Component for selecting models.
    *   `src/components/ollama-status.tsx`: Component for displaying MCP server status.
*   `mcp-server-example/`: A standalone, customizable MCP server built with TypeScript.
*   `src/lib/`: Utility functions.
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
