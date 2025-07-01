import { McpServer, StdioServerTransport } from '@model-context-protocol/server';
import { echoTool } from './tools/echo';
import { filesystemTool } from './tools/filesystem';

/**
 * An MCP Tool Provider Server.
 * This server is designed to be launched as a child process by a main
 * MCP host/orchestrator. It communicates over standard I/O (stdio)
 * and exposes a set of tools for the main host to use.
 */
class ChatStudioToolServer {
  private readonly server: McpServer;

  constructor() {
    this.server = new McpServer({
      // Use StdioServerTransport to communicate with a parent process.
      transport: new StdioServerTransport(),
    });

    this.addTools();
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
      await this.server.start();
      console.log('MCP Tool Server started successfully over stdio.');
      console.log('This server provides the following tools: echo, filesystem.');
    } catch (error) {
      console.error(`Failed to start MCP tool server:`, error);
      process.exit(1);
    }
  }
}

// --- Initialization ---
const mcpToolServer = new ChatStudioToolServer();

// Start the server
mcpToolServer.start();
