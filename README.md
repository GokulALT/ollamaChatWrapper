# Chat Studio - Your AI Assistant and MCP Client

This is Chat Studio, a Next.js application that serves as a powerful **AI development environment**. It allows you to build and interact with AI flows powered by **Google's Genkit**, connect to local models via the **Model Context Protocol (MCP)**, and perform Retrieval-Augmented Generation (RAG) with local documents. The application features a clean user interface built with ShadCN UI components and Tailwind CSS.

## Key Features

*   **Genkit Integration**: Build and test Genkit flows. The default configuration includes support for Google's Gemini models.
*   **Multiple Connection Modes**:
    *   **Direct Mode**: Connect directly to a Genkit flow for advanced AI capabilities, including online models like Gemini.
    *   **MCP Mode**: Connect to a local MCP server to leverage specialized tools and local models.
    *   **RAG Mode**: Chat with your own documents using a local vector database.
*   **Connection Management**: Configure your Genkit, MCP, and ChromaDB server URLs directly in the UI settings.
*   **RAG (Retrieval-Augmented Generation)**: Upload `.txt` documents to a ChromaDB collection. Chat Studio will use these documents to provide context-aware answers.
*   **MCP Tool Support**: In MCP mode, leverage any tool configured on your server (e.g., `filesystem` to analyze local files).
*   **Model & Collection Selection**: Dynamically select AI models and RAG document collections from the sidebar.
*   **Live Status Indicators**: See the connectivity status for your Ollama, MCP, and ChromaDB servers.
*   **System Prompts & Temperature Control**: Configure a system-wide prompt and temperature to guide model behavior.
*   **Dark Mode**: Includes a theme toggle for light and dark modes.

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Ollama](https://ollama.com/) (Optional, for local models) with at least one model pulled (e.g., `ollama run llama3`).
*   [Docker](https://www.docker.com/products/docker-desktop/) (Recommended for running ChromaDB in RAG mode).

## Getting Started with Chat Studio

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project. This is where you'll put your API keys for online models.
    ```env
    # --- Google AI (Gemini) ---
    GEMINI_API_KEY=your_gemini_api_key_here
    
    # --- Optional: ChromaDB Authentication ---
    # Set the method and credentials if your ChromaDB requires a login.
    # CHROMA_AUTH_METHOD= # 'token' or 'basic'
    # CHROMA_TOKEN=
    # CHROMA_USERNAME=
    # CHROMA_PASSWORD=
    ```

4.  **Configure Connection Endpoints:**
    All other connection settings are managed in the UI. Go to **Settings -> General** to configure the URLs for:
    - Ollama (for RAG mode embeddings)
    - MCP Server
    - ChromaDB (for RAG mode)
    These settings are saved locally in your browser.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

6.  **Open your browser**, navigate to the application URL, and configure your endpoints in the settings.

## API Documentation

This project exposes a comprehensive set of REST APIs for external integrations. For detailed information on the available endpoints, request/response formats, and required headers, please see the dedicated **[API Documentation](./API.md)**.

---

## Project Structure

*   `src/app/`: Contains the Next.js pages and API routes.
*   `src/ai/`: Core Genkit configuration and flows.
    *   `src/ai/genkit.ts`: Initializes Genkit and plugins (e.g., Google AI).
    *   `src/ai/flows/`: Contains all Genkit flows, like the main chat handler.
*   `src/components/`: Reusable React components.
*   `mcp-server-example/`: An advanced, stdio-based MCP tool provider built with TypeScript.
*   `mcp-server-standalone-example/`: A simple, all-in-one MCP server built with TypeScript.
*   `src/lib/`: Utility functions and configuration helpers.
*   `src/types/`: TypeScript type definitions.

This project was initialized and developed with the assistance of Firebase Studio.
