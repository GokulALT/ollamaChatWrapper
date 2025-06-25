
"use client";

import React, { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat-window';
import { ModelSelector } from '@/components/model-selector';
import { OllamaStatus } from '@/components/ollama-status';
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

export type ConnectionMode = 'mcp' | 'direct';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [newChatKey, setNewChatKey] = useState<number>(Date.now());
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modelRefreshKey, setModelRefreshKey] = useState<number>(Date.now());
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('mcp');

  useEffect(() => {
    try {
      const storedPrompt = localStorage.getItem('system_prompt');
      if (storedPrompt) {
        setSystemPrompt(storedPrompt);
      }
      const storedMode = localStorage.getItem('connection_mode') as ConnectionMode | null;
      if (storedMode) {
        setConnectionMode(storedMode);
      } else {
        // Default to direct if nothing is stored, as it's the simpler setup.
        setConnectionMode('direct');
      }
    } catch (error) {
      console.warn("Could not access localStorage.");
    }
  }, []);
  
  const handleNewChat = () => {
    setNewChatKey(Date.now());
  };

  const handleRefreshModels = () => {
    setModelRefreshKey(Date.now());
  };

  const handleConnectionModeChange = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    try {
      localStorage.setItem('connection_mode', mode);
    } catch (error) {
      console.warn("Could not access localStorage to set connection mode.");
    }
    // Reset selection and refresh models when mode changes
    setSelectedModel(null);
    handleRefreshModels();
    handleNewChat();
  };

  return (
    <SidebarProvider defaultOpen={true} >
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
          <div className="flex-grow overflow-y-auto">
            <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} refreshKey={modelRefreshKey} connectionMode={connectionMode} />
          </div>
        </SidebarContent>
        <SidebarFooter className="p-0 mt-auto">
          <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
          <OllamaStatus connectionMode={connectionMode} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between p-3 border-b bg-background sticky top-0 z-10 h-[57px]">
           <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden -ml-2" /> 
            <h1 className="text-lg font-semibold font-headline text-foreground truncate pl-1 md:pl-0">
                {selectedModel ? `${selectedModel}` : 'Select a Model'}
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
          <ChatWindow selectedModel={selectedModel} newChatKey={newChatKey} systemPrompt={systemPrompt} connectionMode={connectionMode} />
        </main>
      </SidebarInset>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onModelsUpdate={handleRefreshModels}
        connectionMode={connectionMode}
        onConnectionModeChange={handleConnectionModeChange}
      />
    </SidebarProvider>
  );
}
