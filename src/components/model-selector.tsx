
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
import { Cpu, AlertTriangle } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ollama/models');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch models: ${response.statusText}`);
        }
        const modelsData = await response.json();
        setAvailableModels(modelsData);
      } catch (err: any) {
        console.error("Error fetching models:", err);
        setError(err.message || 'Could not load models from Ollama.');
        setAvailableModels([]); // Clear models on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
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
        {!isLoading && !error && availableModels.length === 0 && (
           <div className="p-2 text-xs text-muted-foreground flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Cpu size={16} />
            <span className="group-data-[collapsible=icon]:hidden">No models found.</span>
          </div>
        )}
        {!isLoading && !error && availableModels.length > 0 && (
          <SidebarMenu>
            {availableModels.map((model) => (
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
  );
}
