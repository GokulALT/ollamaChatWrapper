"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { MessageSquare, FilePlus2, Settings, Sparkles, Database, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { CollectionSelector } from '@/components/collection-selector';
import type { ConnectionMode } from '@/types/chat';
import { ChatWindow } from '@/components/chat-window';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MODE_CONFIG = {
  direct: {
    icon: Zap,
    label: 'Direct',
    description: 'Connect directly to Ollama',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  mcp: {
    icon: Sparkles,
    label: 'MCP',
    description: 'Connect via MCP server',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  rag: {
    icon: Database,
    label: 'RAG',
    description: 'Retrieval Augmented Generation',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
} as const;

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('direct');
  const [newChatKey, setNewChatKey] = useState<number>(Date.now());
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem('connection_mode') as ConnectionMode;
      if (storedMode && ['direct', 'mcp', 'rag'].includes(storedMode)) {
        if (connectionMode !== storedMode) {
            setConnectionMode(storedMode);
            setSelectedModel(null);
            setSelectedCollection(null);
            handleNewChat();
        }
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
  }, [refreshKey]);

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

  const handleModeChange = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    try {
      localStorage.setItem('connection_mode', mode);
    } catch (error) {
      console.warn("Could not access localStorage.");
    }
    setSelectedModel(null);
    setSelectedCollection(null);
    handleNewChat();
  };

  const getHeaderTitle = () => {
    if (connectionMode === 'rag') {
      return selectedCollection ? `RAG: ${selectedCollection}` : 'RAG: Select a Collection';
    }
    return selectedModel ? `${selectedModel}` : 'Select a Model';
  }

  const currentModeConfig = MODE_CONFIG[connectionMode];
  const ModeIcon = currentModeConfig.icon;

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="text-xl font-bold font-headline text-foreground">Chat Studio</h2>
              <p className="text-xs text-muted-foreground">AI-powered conversations</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0 flex flex-col">
          <div className="p-3 space-y-2 group-data-[collapsible=icon]:p-1">
            <Button
              variant="outline"
              className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0 hover:bg-primary/10 hover:border-primary/30 transition-all"
              onClick={handleNewChat}
              title="New Chat"
              aria-label="Start a new chat session"
            >
              <FilePlus2 size={18} className="group-data-[collapsible=icon]:m-0 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">New Chat</span>
            </Button>

            <div className="grid grid-cols-3 gap-1 group-data-[collapsible=icon]:hidden">
              {Object.entries(MODE_CONFIG).map(([mode, config]) => {
                const Icon = config.icon;
                const isActive = connectionMode === mode;
                return (
                  <Button
                    key={mode}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleModeChange(mode as ConnectionMode)}
                    className={cn(
                      "flex flex-col gap-1 h-auto py-2 px-1 transition-all",
                      isActive ? "shadow-sm" : "hover:bg-muted/50"
                    )}
                    title={config.description}
                  >
                    <Icon size={16} className={isActive ? "" : config.color} />
                    <span className="text-[10px] font-medium">{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator className="my-2 group-data-[collapsible=icon]:hidden" />

          <div className="flex-grow overflow-y-auto px-2 space-y-4">
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
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 h-[64px]">
           <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden -ml-2" />
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", currentModeConfig.bgColor)}>
                <ModeIcon size={18} className={currentModeConfig.color} />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h1 className="text-lg font-semibold font-headline text-foreground truncate">
                  {getHeaderTitle()}
                </h1>
                <p className="text-xs text-muted-foreground">{currentModeConfig.description}</p>
              </div>
            </div>
           </div>
          <div className="flex items-center gap-1">
             <Button asChild variant="ghost" size="icon" className="hover:bg-muted/50" title="Settings">
                <Link href="/settings">
                  <Settings size={18} />
                  <span className="sr-only">Settings</span>
                </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
          <ChatWindow
            selectedModel={selectedModel}
            connectionMode={connectionMode}
            newChatKey={newChatKey}
            systemPrompt={systemPrompt}
            selectedCollection={selectedCollection}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
