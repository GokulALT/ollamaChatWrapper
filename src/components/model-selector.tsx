
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

const GEMINI_MODEL = { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash' };

export function ModelSelector({ selectedModel, onSelectModel, refreshKey, connectionMode }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [tools, setTools] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      
      // MCP mode is distinct and connects to the MCP server for its model list.
      if (connectionMode === 'mcp') {
        try {
          const response = await fetch(`/api/ollama/models?mode=mcp`, {
              headers: { 'X-Ollama-Url': getMcpUrl() }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
          }
          const allItems: Model[] = await response.json();
          
          const availableModels = allItems.filter(item => !item.id.startsWith('tool/'));
          const availableTools = allItems.filter(item => item.id.startsWith('tool/'));

          setModels(availableModels);
          setTools(availableTools);

          // Auto-select logic for MCP models
          if (!selectedModel && availableModels.length > 0) {
            onSelectModel(availableModels[0].id);
          } else if (availableModels.length > 0 && selectedModel && !availableModels.some(m => m.id === selectedModel)) {
            onSelectModel(availableModels[0].id);
          } else if (availableModels.length === 0) {
            onSelectModel(null);
          }
        } catch (err: any) {
          console.error("Error fetching MCP models/tools:", err);
          setError(err.message || `Could not load models from MCP.`);
          setModels([]);
          setTools([]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // For 'direct' and 'rag' modes, we fetch local Ollama models and prepend Gemini.
      try {
        const response = await fetch(`/api/ollama/models?mode=direct`, {
            headers: { 'X-Ollama-Url': getOllamaUrl() }
        });

        if (!response.ok) {
            // Don't throw an error if Ollama isn't running, just show an empty list.
            // We can still use the online Gemini model.
            console.warn("Could not fetch local Ollama models. This is okay if you only intend to use online models.");
            setModels([GEMINI_MODEL]);
            onSelectModel(selectedModel || GEMINI_MODEL.id);
            setIsLoading(false);
            return;
        }

        const localModels: Model[] = await response.json();
        const allModels = [GEMINI_MODEL, ...localModels];
        setModels(allModels);
        
        // Auto-select logic for Direct/RAG
        if (!selectedModel || !allModels.some(m => m.id === selectedModel)) {
          onSelectModel(allModels[0]?.id || null);
        }

      } catch (err: any) {
        console.error("Error fetching models:", err);
        setError(err.message || `Could not load models.`);
        setModels([GEMINI_MODEL]); // Still show Gemini even if Ollama fetch fails
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
