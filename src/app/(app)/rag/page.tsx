
"use client";

import { ChatWindow } from '@/components/chat-window';

interface RagPageProps {
  selectedModel: string | null;
  newChatKey: number;
  systemPrompt: string | null;
  selectedCollection: string | null;
}

export default function RagPage({ selectedModel, newChatKey, systemPrompt, selectedCollection }: RagPageProps) {
  return (
    <ChatWindow
      selectedModel={selectedModel}
      newChatKey={newChatKey}
      systemPrompt={systemPrompt}
      connectionMode="rag"
      selectedCollection={selectedCollection}
    />
  );
}
