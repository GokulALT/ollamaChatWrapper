import { McpServer, HttpServerTransport, ollamaProvider } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';
import { filesystemTool } from './tools/filesystem';

/**
 * An all-in-one, standalone MCP server.
 * This server listens on an HTTP port and provides both model access
 * (by connecting to a local Ollama instance) and a set of tools.
 * It's the simplest way to get started with MCP for Chat Studio.
 */
class ChatStudioMcpServer {
  private readonly server: McpServer;
  private readonly port: number;

  constructor(port: number = 8008) {
    this.port = port;
    this.server = new McpServer({
      // Use HttpServerTransport to listen for requests over HTTP.
      transport: new HttpServerTransport({ port: this.port }),
    });

    this.addProviders();
    this.addTools();
  }

  /**
   * Registers the model providers the server will use.
   * This configuration connects to a local Ollama instance.
   */
  private addProviders(): void {
    // The provider will automatically read the OLLAMA_BASE_URL from the
    // environment variables of the shell running this server.
    this.server.addProvider(ollamaProvider);
    console.log(`Provider added: ollama`);
  }

  /**
   * Registers the tools that the server will expose.
   * To add a new tool, import it and add it to this method.
   */
  private addTools(): void {
    // Add the built-in echo tool
    this.server.addTool(echoTool);
    console.log(`Tool added: ${echoTool.spec.name}`);
    
    // Add the powerful filesystem tool
    this.server.addTool(filesystemTool);
    console.log(`Tool added: ${filesystemTool.spec.name}`);
  }

  /**
   * Starts the MCP server and begins listening for requests over HTTP.
   */
  public async start(): Promise<void> {
    try {
      await this.server.start();
      console.log(`MCP Server started successfully on http://localhost:${this.port}`);
      console.log('This server provides access to Ollama models and the following tools: echo, filesystem.');
    } catch (error) {
      console.error(`Failed to start MCP server on port ${this.port}:`, error);
      process.exit(1);
    }
  }
}

// --- Initialization ---
// Use the PORT environment variable if available, otherwise default to 8008.
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8008;
const mcpServer = new ChatStudioMcpServer(port);

// Start the server
mcpServer.start();
