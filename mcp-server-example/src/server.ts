import { McpServer, OllamaProvider, StdioServerTransport } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';
import { filesystemTool } from './tools/filesystem';

/**
 * An MCP server configured to run as a "tool" process.
 * Instead of listening on an HTTP port, it uses StdioServerTransport
 * to communicate with a parent MCP host process over standard I/O.
 * This is an efficient way to orchestrate local, custom-built tool servers.
 */
class ChatStudioMcpToolServer {
  private readonly server: McpServer;

  constructor() {
    this.server = new McpServer({
      // Use StdioServerTransport for local process communication.
      // This tells the server to listen for requests on stdin and
      // send responses on stdout, instead of opening an HTTP port.
      transport: new StdioServerTransport(),
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
    
    // Add the powerful filesystem tool
    this.server.addTool(filesystemTool);
    console.log(`Tool added: ${filesystemTool.spec.name}`);
  }

  /**
   * Starts the MCP server and begins listening for requests over stdio.
   */
  public async start(): Promise<void> {
    try {
      // The start() method requires no arguments when using Stdio transport.
      await this.server.start();
      console.log('MCP Tool Server started successfully using stdio transport.');
      console.log('This server is now ready to be orchestrated by a parent MCP host.');
    } catch (error) {
      console.error('Failed to start MCP server with stdio:', error);
      process.exit(1);
    }
  }
}

// --- Initialization ---
const mcpServer = new ChatStudioMcpToolServer();

// Start the server
mcpServer.start();
