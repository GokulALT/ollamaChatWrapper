
"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import type { ConnectionMode } from '@/types/chat';
import { getOllamaUrl, getMcpUrl } from '@/lib/config';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string | null) => void;
  refreshKey?: number;
  connectionMode: ConnectionMode;
}

export function ModelSelector({ selectedModel, onSelectModel, refreshKey, connectionMode }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [tools, setTools] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchMode = connectionMode === 'rag' ? 'direct' : connectionMode;
        const baseUrl = fetchMode === 'mcp' ? getMcpUrl() : getOllamaUrl();
        
        const response = await fetch(`/api/ollama/models?mode=${fetchMode}`, {
            headers: { 'X-Ollama-Url': baseUrl }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
        }
        const allItems: Model[] = await response.json();
        
        let availableModels: Model[];
        let availableTools: Model[] = [];

        if (connectionMode === 'mcp') {
            availableModels = allItems.filter(item => !item.id.startsWith('tool/'));
            availableTools = allItems.filter(item => item.id.startsWith('tool/'));
        } else {
            availableModels = allItems;
        }

        setModels(availableModels);
        setTools(availableTools);

        if (!selectedModel && availableModels.length > 0) {
          onSelectModel(availableModels[0].id);
        } else if (availableModels.length > 0 && selectedModel && !availableModels.some(m => m.id === selectedModel)) {
          onSelectModel(availableModels[0].id);
        } else if (availableModels.length === 0) {
          onSelectModel(null);
        }

      } catch (err: any) {
        console.error("Error fetching models/tools:", err);
        setError(err.message || `Could not load models from ${connectionMode.toUpperCase()}.`);
        setModels([]);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, connectionMode]);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:py-0">
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Available Models</SidebarGroupLabel>
        <SidebarGroupContent>
          {isLoading && (
            <SidebarMenu>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center w-full p-2">
                      <Cpu size={18} className="mr-2 text-muted-foreground" />
                      <Skeleton className="h-4 w-3/4" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
          {!isLoading && error && (
            <div className="p-2 text-xs text-destructive flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <AlertTriangle size={16} />
              <span className="group-data-[collapsible=icon]:hidden">{error}</span>
            </div>
          )}
          {!isLoading && !error && models.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Cpu size={16} />
              <span className="group-data-[collapsible=icon]:hidden">No models found.</span>
            </div>
          )}
          {!isLoading && !error && models.length > 0 && (
            <SidebarMenu>
              {models.map((model) => (
                <SidebarMenuItem key={model.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectModel(model.id)}
                    isActive={selectedModel === model.id}
                    tooltip={{ children: model.name, side: 'right', align: 'start', className: "ml-2"}}
                  >
                    <Cpu size={18} />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{model.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {connectionMode === 'mcp' && !isLoading && !error && tools.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:py-0 mt-2">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Available Tools</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {tools.map((tool) => (
                        <SidebarMenuItem key={tool.id}>
                            <SidebarMenuButton 
                                className="cursor-default !bg-transparent !text-sidebar-foreground/70 hover:!bg-transparent"
                                tooltip={{ children: tool.name.replace('tool/', ''), side: 'right', align: 'start', className: "ml-2"}}
                            >
                                <Wrench size={18} />
                                <span className="group-data-[collapsible=icon]:hidden truncate">{tool.name.replace('tool/', '')}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
