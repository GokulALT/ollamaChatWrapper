
"use client";

import React, { useState, useEffect } from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, AlertTriangle, Wrench } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string) => void;
  refreshKey?: number;
}

export function ModelSelector({ selectedModel, onSelectModel, refreshKey }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [tools, setTools] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ollama/models');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
        }
        const allItems: Model[] = await response.json();
        
        const availableModels = allItems.filter(item => !item.id.startsWith('tool/'));
        const availableTools = allItems.filter(item => item.id.startsWith('tool/'));

        setModels(availableModels);
        setTools(availableTools);

        if (!selectedModel && availableModels.length > 0) {
          onSelectModel(availableModels[0].id);
        }
      } catch (err: any) {
        console.error("Error fetching models/tools:", err);
        setError(err.message || 'Could not load models from MCP.');
        setModels([]);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [refreshKey, onSelectModel, selectedModel]);

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

      {tools.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:py-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Available Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                   <SidebarMenuButton
                      asChild
                      className="cursor-default"
                      tooltip={{ children: `Tool: ${tool.name}`, side: 'right', align: 'start', className: "ml-2"}}
                    >
                      <div>
                        <Wrench size={18} />
                        <span className="group-data-[collapsible=icon]:hidden truncate">{tool.name.replace('tool/', '')}</span>
                      </div>
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
