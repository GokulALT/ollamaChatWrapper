"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string | null;
  onSystemPromptChange: (prompt: string | null) => void;
  onModelsUpdate: () => void;
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  systemPrompt,
  onSystemPromptChange,
  onModelsUpdate,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt || '');
  const [modelToPull, setModelToPull] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState('');
  const pullStatusRef = useRef<HTMLDivElement>(null);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isModelListLoading, setIsModelListLoading] = useState(false);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  useEffect(() => {
    if (systemPrompt !== null) {
      setCurrentSystemPrompt(systemPrompt);
    }
  }, [systemPrompt]);

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    } else {
        // Reset pull status when dialog is closed
        setPullStatus('');
        setModelToPull('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (pullStatusRef.current) {
        pullStatusRef.current.scrollTop = pullStatusRef.current.scrollHeight;
    }
  }, [pullStatus]);

  const fetchModels = async () => {
    setIsModelListLoading(true);
    try {
      const response = await fetch('/api/ollama/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const modelsData = await response.json();
      setAvailableModels(modelsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch available models.",
      });
    } finally {
      setIsModelListLoading(false);
    }
  };

  const handleSaveSystemPrompt = () => {
    const finalPrompt = currentSystemPrompt.trim();
    localStorage.setItem('system_prompt', finalPrompt);
    onSystemPromptChange(finalPrompt);
    toast({
      title: "System Prompt Saved",
      description: "Start a new chat to apply the changes.",
    });
    onOpenChange(false);
  };
  
  const handlePullModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelToPull.trim() || isPulling) return;

    setIsPulling(true);
    setPullStatus(`Starting pull for model: ${modelToPull}...\n`);

    try {
      const response = await fetch('/api/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelToPull }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start model pull.');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try {
                const jsonData = JSON.parse(line);
                const statusMessage = jsonData.status + (jsonData.digest ? ` (${(jsonData.completed / jsonData.total * 100).toFixed(0)}%)` : '');
                setPullStatus(prev => prev + `${statusMessage}\n`);
            } catch {
                setPullStatus(prev => prev + `${line}\n`);
            }
        }
      }
      setPullStatus(prev => prev + `\nModel '${modelToPull}' pulled successfully!`);
      setModelToPull('');
      onModelsUpdate();
      fetchModels();
    } catch (error: any) {
      const errorMessage = `\nError pulling model: ${error.message}`;
      setPullStatus(prev => prev + errorMessage);
      toast({
        variant: "destructive",
        title: "Pull Error",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete the model '${modelName}'? This cannot be undone.`)) {
        return;
    }
    setDeletingModel(modelName);
    try {
        const response = await fetch('/api/ollama/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete model.');
        }

        toast({
            title: "Model Deleted",
            description: `Successfully deleted '${modelName}'.`,
        });
        onModelsUpdate();
        fetchModels();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Delete Error",
            description: error.message || "An unknown error occurred.",
        });
    } finally {
        setDeletingModel(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] grid-rows-[auto_1fr_auto] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage models and configure chat settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
        <Tabs defaultValue="chat-settings" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2">
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
                className="flex-grow text-sm"
              />
              <p className="text-sm text-muted-foreground">
                The system prompt is sent to the model with every new conversation to set its behavior.
              </p>
            </div>
            <DialogFooter className="mt-auto pt-4">
              <Button onClick={handleSaveSystemPrompt}>Save and Close</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manage-models" className="flex-grow flex flex-col gap-4 py-4 overflow-hidden">
            <form onSubmit={handlePullModel} className="space-y-2">
              <Label htmlFor="model-pull">Pull a new model</Label>
              <div className="flex gap-2">
                <Input
                  id="model-pull"
                  placeholder="e.g., llama3:latest or gemma:2b"
                  value={modelToPull}
                  onChange={(e) => setModelToPull(e.target.value)}
                  disabled={isPulling}
                />
                <Button type="submit" disabled={isPulling || !modelToPull.trim()}>
                  {isPulling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Pull
                </Button>
              </div>
            </form>
            {pullStatus && (
                <div className="p-2 bg-muted rounded-md text-xs h-32" >
                  <ScrollArea className="h-full">
                    <pre className="whitespace-pre-wrap font-mono p-2">{pullStatus}</pre>
                  </ScrollArea>
                </div>
            )}
            
            <Separator />

            <div className="space-y-2 flex-grow flex flex-col overflow-hidden">
              <Label>Available Models</Label>
              <div className="flex-grow border rounded-md overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                  {isModelListLoading ? (
                      <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                  ) : availableModels.length > 0 ? (
                      availableModels.map((model) => (
                          <div key={model.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                              <span className="text-sm truncate pr-2">{model.name}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteModel(model.name)} disabled={deletingModel === model.name}>
                                  {deletingModel === model.name ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </Button>
                          </div>
                      ))
                  ) : (
                      <p className="text-sm text-muted-foreground p-4 text-center">No models found.</p>
                  )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
