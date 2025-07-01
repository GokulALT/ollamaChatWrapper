import { Tool } from '@model-context-protocol/server';
import fs from 'fs/promises';
import path from 'path';

// Define the schema for the tool's input.
const FilesystemInputSchema = {
  type: 'object' as const,
  properties: {
    operation: { type: 'string' as const, enum: ['readFile', 'writeFile', 'listFiles'], description: "The operation to perform." },
    path: { type: 'string' as const, description: 'The path to the file or directory. Must be a relative path.' },
    content: { type: 'string' as const, description: 'The content to write to the file (for writeFile operation).' },
  },
  required: ['operation', 'path'],
};

// Define the schema for the tool's output.
const FilesystemOutputSchema = {
  type: 'object' as const,
  properties: {
    content: { type: 'string' as const, description: 'The content of the file (for readFile operation).' },
    files: { type: 'array' as const, items: { type: 'string' as const }, description: 'A list of files and directories (for listFiles operation).' },
    success: { type: 'boolean' as const, description: 'Indicates if the writeFile operation was successful.' },
    error: { type: 'string' as const, description: 'An error message if the operation failed.' },
  },
};


export const filesystemTool = new Tool({
  name: 'filesystem',
  description: 'Performs file system operations like reading, writing, and listing files. All paths must be relative to the server project root and cannot use ".." to escape the directory.',
  inputSchema: FilesystemInputSchema,
  outputSchema: FilesystemOutputSchema,

  async execute(input: { operation: 'readFile' | 'writeFile' | 'listFiles', path: string, content?: string }) {
    // Security: Prevent path traversal attacks by ensuring the path is relative and within the project.
    const safeBasePath = process.cwd(); // CWD will be the mcp-server-example directory.
    const resolvedPath = path.resolve(safeBasePath, input.path);

    if (!resolvedPath.startsWith(safeBasePath) || input.path.includes('..')) {
        return { error: "Path traversal is not allowed. Please use relative paths within the project." };
    }

    try {
        switch (input.operation) {
            case 'readFile':
                const content = await fs.readFile(resolvedPath, 'utf-8');
                return { content };
            
            case 'writeFile':
                if (typeof input.content !== 'string') {
                    return { error: 'Content is required for writeFile operation.' };
                }
                // Ensure the directory exists before writing the file
                await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
                await fs.writeFile(resolvedPath, input.content, 'utf-8');
                return { success: true };

            case 'listFiles':
                const files = await fs.readdir(resolvedPath);
                return { files };
            
            default:
                // This case should not be reachable due to the schema enum
                return { error: `Unknown operation: ${input.operation}` };
        }
    } catch (e: any) {
        // Return a structured error message
        return { error: `Operation failed: ${e.message}` };
    }
  },
});
