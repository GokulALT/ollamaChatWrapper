
"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConnectionMode } from '@/types/chat';

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
        // RAG mode uses the 'direct' connection to ollama for generation
        const fetchMode = connectionMode === 'rag' ? 'direct' : connectionMode;
        const response = await fetch(`/api/ollama/models?mode=${fetchMode}`);
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

        // Auto-select the first model if none is selected and models are available
        if (!selectedModel && availableModels.length > 0) {
          onSelectModel(availableModels[0].id);
        } else if (availableModels.length > 0 && selectedModel && !availableModels.some(m => m.id === selectedModel)) {
          // If the selected model is not in the new list, select the first one
          onSelectModel(availableModels[0].id);
        } else if (availableModels.length === 0) {
          // No models available, so deselect any current model
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
      <div className="px-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Available Models</h3>
        {isLoading && (
          <div className="space-y-1 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center rounded-md p-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && error && (
          <div className="p-2 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        {!isLoading && !error && models.length === 0 && (
          <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
            <Cpu size={16} />
            No models found.
          </div>
        )}
        <div className="space-y-1">
          {!isLoading && !error && models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`w-full text-left text-sm p-2 rounded-md flex items-center gap-2 truncate ${
                selectedModel === model.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
              }`}
            >
              <Cpu size={16} />
              {model.name}
            </button>
          ))}
        </div>
      </div>

      {connectionMode === 'mcp' && models.length > 0 && tools.length > 0 && (
         <div className="px-2 mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Available Tools</h3>
          <div className="space-y-1">
            {tools.map((tool) => (
              <div key={tool.id} className="text-sm p-2 flex items-center gap-2 text-muted-foreground">
                <Wrench size={16} />
                {tool.name.replace('tool/', '')}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
