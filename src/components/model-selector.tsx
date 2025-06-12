"use client";

import React from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Cpu } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

const availableModels: Model[] = [
  { id: 'llama3-8b', name: 'Llama 3 8B' },
  { id: 'mistral-7b', name: 'Mistral 7B' },
  { id: 'gemma-2b', name: 'Gemma 2B' },
  { id: 'phi3-mini', name: 'Phi-3 Mini' },
];

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:py-0">
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Available Models</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {availableModels.map((model) => (
            <SidebarMenuItem key={model.id}>
              <SidebarMenuButton
                onClick={() => onSelectModel(model.id)}
                isActive={selectedModel === model.id}
                tooltip={{ children: model.name, side: 'right', align: 'start', className: "ml-2"}}
              >
                <Cpu size={18} />
                <span className="group-data-[collapsible=icon]:hidden">{model.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
