
"use client";

import { ChatWindow } from '@/components/chat-window';

interface DirectPageProps {
  selectedModel: string | null;
  newChatKey: number;
  systemPrompt: string | null;
  // selectedCollection is passed by layout but unused here
}

export default function DirectPage({ selectedModel, newChatKey, systemPrompt }: DirectPageProps) {
  return (
    <ChatWindow
      selectedModel={selectedModel}
      newChatKey={newChatKey}
      systemPrompt={systemPrompt}
      connectionMode="direct"
      selectedCollection={null}
    />
  );
}
