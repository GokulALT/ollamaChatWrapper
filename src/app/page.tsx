
"use client";

import React, { useState, useEffect } from 'react';
import { ModelSelector } from '@/components/model-selector';
import { OllamaStatus } from '@/components/ollama-status';
import { RagStatus } from '@/components/rag-status';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, FilePlus2, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsDialog } from '@/components/settings-dialog';
import { CollectionSelector } from '@/components/collection-selector';
import type { ConnectionMode } from '@/types/chat';
import { ChatWindow } from '@/components/chat-window';

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
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            <h2 className="text-xl font-semibold font-headline text-foreground group-data-[collapsible=icon]:hidden">Chat Studio</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0 flex flex-col">
          <div className="p-2 group-data-[collapsible=icon]:p-1">
            <Button
              variant="outline"
              className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
              onClick={handleNewChat}
              title="New Chat"
              aria-label="Start a new chat session"
            >
              <FilePlus2 size={18} className="group-data-[collapsible=icon]:m-0 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
            </Button>
          </div>
          
          <Separator className="my-2 group-data-[collapsible=icon]:hidden" />

          <div className="flex-grow overflow-y-auto mt-4">
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
        </SidebarContent>
        <SidebarFooter className="p-0 mt-auto">
          <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
          <OllamaStatus connectionMode={connectionMode === 'rag' ? 'direct' : connectionMode} />
          {connectionMode === 'rag' && <RagStatus />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between p-3 border-b bg-background sticky top-0 z-10 h-[57px]">
           <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden -ml-2" /> 
            <h1 className="text-lg font-semibold font-headline text-foreground truncate pl-1 md:pl-0">
                {getHeaderTitle()}
            </h1>
           </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} title="Settings">
              <Settings size={18} />
              <span className="sr-only">Settings</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden h-[calc(100vh-57px)]">
          <ChatWindow
            selectedModel={selectedModel}
            connectionMode={connectionMode}
            newChatKey={newChatKey}
            systemPrompt={systemPrompt}
            selectedCollection={selectedCollection}
          />
        </main>
      </SidebarInset>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onModelsUpdate={handleRefresh}
        onRagUpdate={handleRefresh}
        connectionMode={connectionMode}
        onConnectionModeChange={handleConnectionModeChange}
      />
    </SidebarProvider>
  );
}
