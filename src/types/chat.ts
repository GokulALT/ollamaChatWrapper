
export interface Source {
  id: string;
  pageContent: string;
  metadata: Record<string, any>;
}

export type ConnectionMode = 'mcp' | 'direct' | 'rag';

export interface ChatMessageData {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  model?: string;
  sources?: Source[];
}
