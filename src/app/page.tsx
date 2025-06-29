
"use client";

import React, { useState, useEffect } from 'react';
import { ModelSelector } from '@/components/model-selector';
import { OllamaStatus } from '@/components/ollama-status';
import { RagStatus } from '@/components/rag-status';
import { ChatWindow } from '@/components/chat-window';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, FilePlus2, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsDialog } from '@/components/settings-dialog';
import { CollectionSelector } from '@/components/collection-selector';
import type { ConnectionMode } from '@/types/chat';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('direct');
  const [newChatKey, setNewChatKey] = useState<number>(Date.now());
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem('connection_mode') as ConnectionMode;
      if (storedMode && ['direct', 'mcp', 'rag'].includes(storedMode)) {
        setConnectionMode(storedMode);
      }
      const storedPrompt = localStorage.getItem('system_prompt');
      if (storedPrompt) setSystemPrompt(storedPrompt);

      if (storedMode === 'rag') {
          const storedCollection = localStorage.getItem('selected_collection');
          if (storedCollection) setSelectedCollection(storedCollection);
      }
    } catch (error) {
      console.warn("Could not access localStorage.");
    }
  }, []);

  const handleConnectionModeChange = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    setSelectedModel(null);
    setSelectedCollection(null);
    handleRefresh();
    handleNewChat();
    try {
      localStorage.setItem('connection_mode', mode);
    } catch (error) {
      console.warn("Could not access localStorage.");
    }
  };

  const handleNewChat = () => {
    setNewChatKey(Date.now());
  };

  const handleRefresh = () => {
    setRefreshKey(Date.now());
  };
  
  const handleSelectCollection = (collection: string | null) => {
    setSelectedCollection(collection);
    if(collection) {
      try {
        localStorage.setItem('selected_collection', collection);
      } catch (error) {
        console.warn("Could not access localStorage to set selected collection.");
      }
    } else {
      try {
        localStorage.removeItem('selected_collection');
      } catch (error) {
        console.warn("Could not access localStorage.");
      }
    }
    handleNewChat();
  };

  const getHeaderTitle = () => {
    if (connectionMode === 'rag') {
      return selectedCollection ? `RAG: ${selectedCollection}` : 'RAG: Select a Collection';
    }
    return selectedModel ? `${selectedModel}` : 'Select a Model';
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 flex flex-col border-r bg-muted/20">
        <div className="p-4 flex items-center gap-2 border-b">
          <MessageSquare className="h-7 w-7 text-primary" />
          <h2 className="text-xl font-semibold font-headline">Chat Studio</h2>
        </div>
        <div className="p-2">
          <Button variant="outline" className="w-full" onClick={handleNewChat}>
            <FilePlus2 size={16} className="mr-2" /> New Chat
          </Button>
        </div>
        <Separator className="my-2" />
        <div className="flex-grow overflow-y-auto">
            {connectionMode === 'rag' && (
              <CollectionSelector 
                selectedCollection={selectedCollection} 
                onSelectCollection={handleSelectCollection} 
                refreshKey={refreshKey}
              />
            )}
            <ModelSelector 
              selectedModel={selectedModel} 
              onSelectModel={setSelectedModel} 
              refreshKey={refreshKey} 
              connectionMode={connectionMode} 
            />
        </div>
        <div className="p-2 border-t mt-auto">
          <OllamaStatus connectionMode={connectionMode === 'rag' ? 'direct' : connectionMode} />
          {connectionMode === 'rag' && <RagStatus />}
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-3 border-b">
          <h1 className="text-lg font-semibold font-headline">{getHeaderTitle()}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <ChatWindow
            selectedModel={selectedModel}
            connectionMode={connectionMode}
            newChatKey={newChatKey}
            systemPrompt={systemPrompt}
            selectedCollection={selectedCollection}
          />
        </main>
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        connectionMode={connectionMode}
        onConnectionModeChange={handleConnectionModeChange}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onModelsUpdate={handleRefresh}
        onRagUpdate={handleRefresh}
      />
    </div>
  );
}
