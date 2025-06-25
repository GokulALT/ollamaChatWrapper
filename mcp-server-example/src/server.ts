import { McpServer, OllamaProvider, Tool } from '@mcp/server';
import { echoTool } from './tools/echo';

// --- Configuration ---
const PORT = 8008; // The port the MCP server will listen on

async function main() {
  // 1. Create a new MCP Server instance
  const server = new McpServer({
    // Optional: Add server-level configuration here
  });

  // 2. Add one or more Model Providers
  // This example adds an Ollama provider. It will automatically find and
  // connect to a running Ollama instance on the default port.
  const ollamaProvider = new OllamaProvider();
  server.addProvider(ollamaProvider);
  console.log('Ollama provider added.');

  // 3. Add one or more Tools
  // Here we add our custom echo tool.
  server.addTool(echoTool);
  console.log(`Tool added: ${echoTool.spec.name}`);

  // You can add more tools here by importing them and calling server.addTool()
  // See the README.md for a detailed guide on adding a new 'calculator' tool.
  // Example:
  // import { calculatorTool } from './tools/calculator';
  // server.addTool(calculatorTool);
  // console.log(`Tool added: ${calculatorTool.spec.name}`);


  // 4. Start the server
  try {
    await server.start(PORT);
    console.log(`MCP Server started successfully on http://localhost:${PORT}`);
    console.log('The server is now ready to accept connections from Chat Studio.');
    console.log('Available Models and Tools will be dynamically loaded from this server.');

  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
