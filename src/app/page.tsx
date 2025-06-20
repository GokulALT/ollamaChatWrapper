"use client";

import React, { useState } from 'react';
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
import { Settings2, MessageSquare, FilePlus2 } from 'lucide-react';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>('llama3-8b'); // Default model selected
  const [newChatKey, setNewChatKey] = useState<number>(Date.now());

  const handleNewChat = () => {
    setNewChatKey(Date.now());
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
            <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
          </div>
        </SidebarContent>
        <SidebarFooter className="p-0 mt-auto">
          <Separator className="my-0 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
          <OllamaStatus />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between p-3 border-b bg-background sticky top-0 z-10 h-[57px]">
           <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden -ml-2" /> {/* Show only on mobile if sidebar is collapsible icon type for desktop */}
            <h1 className="text-lg font-semibold font-headline text-foreground truncate pl-1 md:pl-0">
                {selectedModel ? `${selectedModel}` : 'Select a Model'}
            </h1>
           </div>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>
        
        <main className="flex-1 overflow-hidden h-[calc(100vh-57px)]">
          <ChatWindow selectedModel={selectedModel} newChatKey={newChatKey} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
