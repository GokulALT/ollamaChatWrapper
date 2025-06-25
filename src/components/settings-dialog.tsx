
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { Info, Trash2, Loader2, DownloadCloud } from 'lucide-react';
import type { ConnectionMode } from '@/app/page';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string | null;
  onSystemPromptChange: (prompt: string | null) => void;
  onModelsUpdate: () => void;
  connectionMode: ConnectionMode;
  onConnectionModeChange: (mode: ConnectionMode) => void;
}

interface Model {
    name: string;
    size: number;
}

function DirectModelManager({ onModelsUpdate }: { onModelsUpdate: () => void }) {
    const { toast } = useToast();
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pullModelName, setPullModelName] = useState('');
    const [isPulling, setIsPulling] = useState(false);
    const [pullStatus, setPullStatus] = useState('');
    const [deletingModel, setDeletingModel] = useState<string | null>(null);

    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/ollama/models?mode=direct');
            if (!res.ok) throw new Error("Failed to fetch models");
            const data = await res.json();
            setModels(data);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch local models." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handlePullModel = async (e: FormEvent) => {
        e.preventDefault();
        if (!pullModelName.trim()) return;

        setIsPulling(true);
        setPullStatus('Starting download...');
        try {
            const response = await fetch('/api/ollama/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: pullModelName }),
            });

            if (!response.ok || !response.body) {
                const err = await response.text();
                throw new Error(err || 'Failed to pull model');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                lines.forEach(line => {
                    try {
                        const json = JSON.parse(line);
                        setPullStatus(json.status);
                    } catch (e) {
                        // ignore parse errors
                    }
                });
            }

            toast({ title: "Model Pulled", description: `${pullModelName} has been downloaded.` });
            setPullModelName('');
            await fetchModels();
            onModelsUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsPulling(false);
            setPullStatus('');
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        setDeletingModel(modelName);
        try {
            const res = await fetch('/api/ollama/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: "Model Deleted", description: `${modelName} has been removed.` });
            await fetchModels();
            onModelsUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setDeletingModel(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="pull-model">Pull a new model</Label>
                <form onSubmit={handlePullModel} className="flex items-center gap-2 mt-1">
                    <Input id="pull-model" placeholder="e.g., llama3:8b" value={pullModelName} onChange={e => setPullModelName(e.target.value)} disabled={isPulling} />
                    <Button type="submit" disabled={isPulling || !pullModelName.trim()}>
                        {isPulling ? <Loader2 className="animate-spin" /> : <DownloadCloud />}
                    </Button>
                </form>
                {isPulling && <p className="text-sm text-muted-foreground mt-2 animate-pulse">{pullStatus}</p>}
            </div>
            <div>
                <h4 className="text-sm font-medium mb-2">Local Models</h4>
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <ScrollArea className="h-48 rounded-md border">
                        <div className="p-2 space-y-1">
                            {models.length > 0 ? models.map(model => (
                                <div key={model.name} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                                    <span className="text-sm truncate">{model.name}</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteModel(model.name)} disabled={!!deletingModel}>
                                        {deletingModel === model.name ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground p-2">No local models found.</p>}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  systemPrompt,
  onSystemPromptChange,
  onModelsUpdate,
  connectionMode,
  onConnectionModeChange
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt || '');

  useEffect(() => {
    setCurrentSystemPrompt(systemPrompt || '');
  }, [systemPrompt]);

  const handleSaveSystemPrompt = () => {
    const finalPrompt = currentSystemPrompt.trim();
    onSystemPromptChange(finalPrompt);
     try {
      localStorage.setItem('system_prompt', finalPrompt);
    } catch (error) {
      console.warn("Could not access localStorage to set system prompt.");
    }
    toast({
      title: "System Prompt Saved",
      description: "Start a new chat to apply the changes.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] grid-rows-[auto_auto_1fr] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure chat settings and manage your connection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 border-b">
            <Label>Connection Mode</Label>
            <RadioGroup value={connectionMode} onValueChange={onConnectionModeChange} className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <RadioGroupItem value="direct" id="direct" className="peer sr-only" />
                    <Label htmlFor="direct" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Direct (Ollama)
                        <span className="text-xs text-muted-foreground font-normal mt-1 text-center">Connect directly to a local Ollama instance.</span>
                    </Label>
                </div>
                 <div>
                    <RadioGroupItem value="mcp" id="mcp" className="peer sr-only" />
                    <Label htmlFor="mcp" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        MCP Server
                        <span className="text-xs text-muted-foreground font-normal mt-1 text-center">Connect to a Model Context Protocol server.</span>
                    </Label>
                </div>
            </RadioGroup>
        </div>
        
        <div className="flex-grow overflow-hidden">
        <Tabs defaultValue="chat-settings" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mt-4">
            <TabsTrigger value="chat-settings">Chat Settings</TabsTrigger>
            <TabsTrigger value="manage-models">Manage Models</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat-settings" className="flex-grow flex flex-col gap-4 py-4 overflow-y-auto">
            <div className="space-y-2 flex-grow flex flex-col">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="e.g., You are a helpful assistant that always replies in pirate speak."
                value={currentSystemPrompt}
                onChange={(e) => setCurrentSystemPrompt(e.target.value)}
                className="flex-grow text-sm min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">
                The system prompt is sent to the model with every new conversation to set its behavior.
              </p>
            </div>
            <DialogFooter className="mt-auto pt-4">
              <Button onClick={() => { handleSaveSystemPrompt(); onOpenChange(false); }}>Save and Close</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manage-models" className="flex-grow flex flex-col gap-4 py-4 overflow-y-auto">
             {connectionMode === 'mcp' ? (
                <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 rounded-lg p-6">
                    <Info className="w-10 h-10 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Model Management via MCP</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        To add, remove, or update models, please edit your Model Context Protocol (MCP) server's configuration file and restart the server.
                    </p>
                </div>
             ) : (
                <DirectModelManager onModelsUpdate={onModelsUpdate} />
             )}
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
