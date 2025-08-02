# Chat Studio API Documentation

Chat Studio provides a set of API endpoints that allow you to integrate its capabilities into external systems, scripts, or other applications.

## Required Headers

When calling the API from an external system, you must provide the necessary connection URLs in the request headers. These URLs are the same ones you configure in the Chat Studio UI settings.

-   `X-Ollama-Url`: Required for any operation involving Ollama (e.g., chat in `direct` or `rag` mode, listing models, pulling models).
-   `X-Mcp-Url`: Required for `mcp` mode operations.
-   `X-Chroma-Url`: Required for `rag` mode operations (e.g., managing collections, uploading documents).

## Chat API

#### `POST /api/chat`

This single endpoint handles all chat modes (`direct`, `mcp`, and `rag`). The behavior is determined by the `connectionMode` property in the JSON request body.

-   **Request Body**:
    ```json
    {
      "connectionMode": "direct" | "mcp" | "rag",
      "model": "string",
      "messages": [
        { "role": "system" | "user" | "assistant", "content": "string" },
        { "role": "user", "content": "Hello, world!" }
      ],
      "systemPrompt": "string (optional)",
      "temperature": "number (optional)",
      "collection": "string (required for rag mode)"
    }
    ```
-   **Response**: A streaming response with the model's output as plain text. In RAG mode, the stream is prefixed with a JSON object of the sources, separated by `_--_SEPARATOR_--_`.

## Model Management APIs

These APIs interact with a local Ollama instance and require the `X-Ollama-Url` header.

#### `GET /api/ollama/models`

-   **Description**: Fetches a list of available models. Supports `direct` and `mcp` modes via a query parameter.
-   **Query Parameter**: `mode=direct` (for Ollama) or `mode=mcp` (for an MCP server). Defaults to `mcp`.
-   **Response**: `[{ "id": "string", "name": "string" }]`

#### `POST /api/ollama/pull`

-   **Description**: Downloads a new model to your local Ollama instance.
-   **Request Body**: `{ "name": "model-name:tag" }`
-   **Response**: A streaming response of the pull status from Ollama.

#### `POST /api/ollama/delete`

-   **Description**: Deletes a model from your local Ollama instance.
-   **Request Body**: `{ "name": "model-name:tag" }`
-   **Response**: `{ "message": "Successfully deleted model..." }`

## RAG Management APIs

These APIs interact with a ChromaDB instance and require the `X-Chroma-Url` header. The upload endpoint also requires `X-Ollama-Url`.

#### `GET /api/rag/collections`

-   **Description**: Lists all available collections (databases) in ChromaDB.
-   **Response**: `[{ "id": "string", "name": "string" }]`

#### `POST /api/rag/collections`

-   **Description**: Creates a new collection in ChromaDB.
-   **Request Body**: `{ "name": "my-new-collection" }`
-   **Response**: `{ "id": "...", "name": "my-new-collection", ... }`

#### `DELETE /api/rag/collections`

-   **Description**: Deletes a collection from ChromaDB.
-   **Query Parameter**: `?name=my-collection-to-delete`
-   **Response**: `{ "message": "Collection '...' deleted." }`

#### `POST /api/rag/upload`

-   **Description**: Uploads and embeds a document into a specified collection.
-   **Request Body**: `multipart/form-data` with two fields:
    1.  `file`: The `.txt` file to upload.
    2.  `collectionName`: The name of the collection to add the file to.
-   **Response**: `{ "message": "File processed successfully.", "count": <number_of_chunks> }`

## Status APIs

#### `GET /api/ollama/status`

-   **Description**: Checks the status of the Ollama or MCP server.
-   **Query Parameter**: `mode=direct` or `mode=mcp`. Defaults to `mcp`.
-   **Required Header**: `X-Ollama-Url` or `X-Mcp-Url`.
-   **Response**: `{ "online": boolean, "message": "string" }`

#### `GET /api/rag/status`

-   **Description**: Checks the status of the ChromaDB server.
-   **Required Header**: `X-Chroma-Url`.
-   **Response**: `{ "online": boolean, "message": "string" }`
