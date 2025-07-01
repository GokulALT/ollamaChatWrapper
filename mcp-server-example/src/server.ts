import { McpServer, OllamaProvider } from '@mcp/server';
import { echoTool } from './tools/echo';

/**
 * A robust, class-based implementation of an MCP server for Chat Studio.
 * This structure makes it easier to manage providers and tools as the
 * server grows in complexity.
 */
class ChatStudioMcpServer {
  private readonly server: McpServer;
  private readonly port: number;

  constructor(port: number) {
    this.port = port;
    this.server = new McpServer({
      // Optional: Add server-level configuration here
    });

    this.addProviders();
    this.addTools();
  }

  /**
   * Registers the model providers that the server will use.
   * This example adds an Ollama provider, which automatically connects
   * to a running Ollama instance.
   */
  private addProviders(): void {
    const ollamaProvider = new OllamaProvider();
    this.server.addProvider(ollamaProvider);
    console.log('Ollama provider added.');
  }

  /**
   * Registers the tools that the server will expose.
   * To add a new tool, import it and add it to this method.
   */
  private addTools(): void {
    // Add the built-in echo tool
    this.server.addTool(echoTool);
    console.log(`Tool added: ${echoTool.spec.name}`);
    
    // See the README.md for a detailed guide on adding a new 'calculator' tool.
    // Example:
    // import { calculatorTool } from './tools/calculator';
    // this.server.addTool(calculatorTool);
    // console.log(`Tool added: ${calculatorTool.spec.name}`);
  }

  /**
   * Starts the MCP server and listens for incoming connections.
   */
  public async start(): Promise<void> {
    try {
      await this.server.start(this.port);
      console.log(`MCP Server started successfully on http://localhost:${this.port}`);
      console.log('The server is now ready to accept connections from Chat Studio.');
      console.log('Available Models and Tools will be dynamically loaded from this server.');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// --- Configuration & Initialization ---
const PORT = 8008; // The port the MCP server will listen on
const mcpServer = new ChatStudioMcpServer(PORT);

// Start the server
mcpServer.start();
