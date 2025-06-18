# OllamaChat - Chat with Local LLMs

This is a Next.js application built with Firebase Studio that allows you to chat with large language models (LLMs) hosted by a local Ollama server. It features a clean user interface built with ShadCN UI components and Tailwind CSS.

## Features

*   **Chat Interface**: Engage in conversations with your selected Ollama model.
*   **Model Selection**: Dynamically lists and allows you to choose from available models on your Ollama server.
*   **New Chat Session**: Easily clear the current conversation and start a new one.
*   **Ollama Server Status**: Displays the connectivity status to your local Ollama server, along with (simulated) CPU and RAM usage.
*   **Multi-line Input**: Supports multi-line message input with Shift+Enter for newlines.
*   **Responsive Design**: Adapts to different screen sizes.

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A running [Ollama](https://ollama.com/) server instance on your local machine.

## Getting Started

1.  **Clone the repository (if applicable) or ensure you have the project files.**

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project and add the base URL for your Ollama server:
    ```env
    OLLAMA_BASE_URL=http://localhost:11434
    ```
    Adjust the URL if your Ollama server is running on a different port or host.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002` (as per your `package.json` dev script).

5.  **Open your browser** and navigate to the application URL. You should see the OllamaChat interface. If your Ollama server is running and accessible, you'll be able to select a model and start chatting.

## Project Structure

*   `src/app/`: Contains the Next.js pages and API routes.
    *   `src/app/page.tsx`: The main page component for the chat interface.
    *   `src/app/api/ollama/`: API routes for interacting with the Ollama server (fetching models, chat, status).
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/chat-window.tsx`: The main chat interface component.
    *   `src/components/model-selector.tsx`: Component for selecting Ollama models.
    *   `src/components/ollama-status.tsx`: Component for displaying Ollama server status.
*   `src/lib/`: Utility functions.
*   `src/types/`: TypeScript type definitions.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/)
*   **UI Library**: [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)

This project was initialized and developed with the assistance of Firebase Studio.
