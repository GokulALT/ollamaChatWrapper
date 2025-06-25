# Chat Studio - Your AI Assistant powered by MCP

This is a Next.js application built with Firebase Studio that acts as a powerful AI assistant. In Chat Studio, the AI models communicate with **Model Context Protocol (MCP)** servers, allowing them to be augmented with specialized tools and data sources. This turns a simple chat into a powerful, context-aware conversation. The application features a clean user interface built with ShadCN UI components and Tailwind CSS.

## The Model Context Protocol (MCP)

The Model Context Protocol (MCP) employs a client-host-server architecture to enable AI models to interact with various tools and data sources. It standardizes communication between AI applications and external systems, akin to how USB-C connects devices to peripherals.

Here's a breakdown of the key components:

### 1. Host (Client Application)

- This is the AI-powered application, such as a chatbot, IDE, or voice assistant.
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
*   **MCP Tool Support**: Leverage any specialized server (tool) configured on your MCP server. For example, use the `filesystem` tool to have the assistant read and analyze local files by referencing them in your prompt (e.g., `Summarize the file at file://filesystem/path/to/your/document.txt`).
*   **Model Selection**: Dynamically lists and allows you to choose from available models and tools on your MCP server.
*   **New Chat Session**: Easily clear the current conversation and start a new one.
*   **MCP Server Status**: Displays the connectivity status to your local MCP server.
*   **System Prompts**: Configure a system-wide prompt to guide the behavior of your models.
*   **Multi-line Input**: Supports multi-line message input with Shift+Enter for newlines.
*   **Markdown Rendering**: Chat messages can render Markdown for richer text formatting.
*   **Dark Mode**: Includes a theme toggle for light and dark modes.

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A running [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server instance on your local machine, configured with one or more model providers (like Ollama) and any desired tools (like `server-filesystem`).

## Getting Started

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project and add the base URL for your MCP server.
    ```env
    # This must be the URL of your MCP server, e.g., http://localhost:8008
    OLLAMA_BASE_URL=http://localhost:8008
    ```
    Adjust the URL if your MCP server is running on a different port or host.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

5.  **Open your browser** and navigate to the application URL. If your MCP server is running and accessible, you'll be able to select a model and start chatting.

## Project Structure

*   `src/app/`: Contains the Next.js pages and API routes.
    *   `src/app/page.tsx`: The main page component for the chat interface.
    *   `src/app/api/ollama/`: API routes for interacting with the MCP server (fetching models, chat, status).
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/chat-window.tsx`: The main chat interface component.
    *   `src/components/model-selector.tsx`: Component for selecting models.
    *   `src/components/ollama-status.tsx`: Component for displaying MCP server status.
*   `src/lib/`: Utility functions.
*   `src/types/`: TypeScript type definitions.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/)
*   **Backend Protocol**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
*   **UI Library**: [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)

This project was initialized and developed with the assistance of Firebase Studio.
