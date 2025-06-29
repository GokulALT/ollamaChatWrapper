
"use client";

import { ChatWindow } from '@/components/chat-window';

interface McpPageProps {
  selectedModel: string | null;
  newChatKey: number;
  systemPrompt: string | null;
  // selectedCollection is passed by layout but unused here
}

export default function McpPage({ selectedModel, newChatKey, systemPrompt }: McpPageProps) {
  return (
    <ChatWindow
      selectedModel={selectedModel}
      newChatKey={newChatKey}
      systemPrompt={systemPrompt}
      connectionMode="mcp"
      selectedCollection={null}
    />
  );
}
