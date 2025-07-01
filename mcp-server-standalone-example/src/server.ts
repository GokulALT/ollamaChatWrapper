import 'dotenv/config';
import { McpServer, HttpServerTransport, OllamaModelProvider } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';

/**
 * A simple, standalone MCP Server.
 *
 * This server demonstrates the basics of the MCP TypeScript SDK. It does two things:
 * 1. It acts as a "provider" for Ollama, making any local Ollama models available over MCP.
 * 2. It exposes a simple "echo" tool.
 *
 * It runs as a single process and uses an HTTP transport, so you can connect to
 * it directly from an MCP client like Chat Studio.
 */
class StandaloneMcpServer {
  private readonly server: McpServer;
  private readonly port: number;

  constructor() {
    this.port = parseInt(process.env.MCP_PORT || '8008', 10);
    
    // An MCP server is initialized with a "transport".
    // HttpServerTransport makes it a standalone server that listens on a network port.
    this.server = new McpServer({
      transport: new HttpServerTransport({
        port: this.port,
      }),
    });

    this.addProviders();
    this.addTools();
  }

  /**
   * Registers any model providers the server will use.
   * Providers make models from services like Ollama or Bedrock available to clients.
   */
  private addProviders(): void {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
    if (!ollamaBaseUrl) {
      console.warn('OLLAMA_BASE_URL is not set. Ollama models will not be available.');
      return;
    }

    // The OllamaModelProvider bridges your local Ollama instance to the MCP server.
    const ollamaProvider = new OllamaModelProvider({
      baseURL: ollamaBaseUrl,
    });

    this.server.addModelProvider(ollamaProvider);
    console.log(`Ollama provider added, connecting to ${ollamaBaseUrl}`);
  }

  /**
   * Registers the tools that the server will expose.
   * To add a new tool, import it and add it to this method.
   */
  private addTools(): void {
    // Add the built-in echo tool
    this.server.addTool(echoTool);
    console.log(`Tool added: ${echoTool.spec.name}`);
  }

  /**
   * Starts the MCP server and begins listening for requests.
   */
  public async start(): Promise<void> {
    try {
      await this.server.start();
      console.log(`✅ Standalone MCP Server started successfully.`);
      console.log(`   Listening on http://localhost:${this.port}`);
      console.log(`   Providing models from Ollama and the "echo" tool.`);
    } catch (error) {
      console.error(`❌ Failed to start standalone MCP server:`, error);
      process.exit(1);
    }
  }
}

// --- Initialization ---
const mcpServer = new StandaloneMcpServer();

// Start the server
mcpServer.start();
