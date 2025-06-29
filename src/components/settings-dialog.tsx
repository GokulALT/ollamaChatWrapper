
"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Info, Trash2, Loader2, DownloadCloud, Upload, Database } from 'lucide-react';
import type { ConnectionMode } from '@/types/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string | null;
  onSystemPromptChange: (prompt: string | null) => void;
  onModelsUpdate: () => void;
  onRagUpdate: () => void;
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

    const fetchModels = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

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
                    } catch (e) { /* ignore parse errors */ }
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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Pull a new model</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePullModel} className="flex items-center gap-2">
                        <Input id="pull-model" placeholder="e.g., llama3:8b" value={pullModelName} onChange={e => setPullModelName(e.target.value)} disabled={isPulling} />
                        <Button type="submit" size="icon" disabled={isPulling || !pullModelName.trim()}>
                            {isPulling ? <Loader2 className="animate-spin" /> : <DownloadCloud size={18} />}
                        </Button>
                    </form>
                    {isPulling && <p className="text-sm text-muted-foreground mt-2 animate-pulse">{pullStatus}</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Local Models</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? ( <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div> ) : (
                        <div className="p-2 space-y-1 rounded-md border">
                            {models.length > 0 ? models.map(model => (
                                <div key={model.name} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                                    <span className="text-sm truncate">{model.name}</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteModel(model.name)} disabled={!!deletingModel}>
                                        {deletingModel === model.name ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground p-4 text-center">No local models found.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function RagManager({ onRagUpdate }: { onRagUpdate: () => void }) {
    const { toast } = useToast();
    const [collections, setCollections] = useState<{name: string}[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);

    const fetchCollections = useCallback(async () => {
        setIsLoadingCollections(true);
        try {
            const res = await fetch('/api/rag/collections');
            if (!res.ok) throw new Error('Failed to fetch collections');
            const data = await res.json();
            setCollections(data);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsLoadingCollections(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleCreateCollection = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/rag/collections', {
                method: 'POST',
                body: JSON.stringify({ name: newCollectionName }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: 'Collection Created', description: `Successfully created "${newCollectionName}".` });
            setNewCollectionName('');
            await fetchCollections();
            onRagUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Creation Failed", description: error.message });
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleDeleteCollection = async () => {
        if (!selectedCollection) return;
        setIsDeleting(true);
        try {
             const res = await fetch(`/api/rag/collections?name=${selectedCollection}`, { method: 'DELETE' });
             if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: 'Collection Deleted', description: `Successfully deleted "${selectedCollection}".` });
            setSelectedCollection('');
            await fetchCollections();
            onRagUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !selectedCollection) {
            toast({ variant: 'destructive', title: "Upload Error", description: "Please select a collection and a file." });
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collectionName', selectedCollection);

        try {
            const res = await fetch('/api/rag/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "An unknown error occurred during upload.");
            }
            const result = await res.json();
            toast({ title: "Upload Successful", description: `${result.count} chunks added to "${selectedCollection}".` });
            setFile(null);
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>RAG Mode Prerequisites</AlertTitle>
                <AlertDescription>
                   For RAG mode to function, you need two services running locally:
                   <ul className="list-disc list-inside mt-2 text-xs">
                        <li><span className="font-semibold">ChromaDB Server:</span> The vector database for your documents (usually at http://localhost:8000).</li>
                        <li><span className="font-semibold">Ollama:</span> Used for embedding documents and generating chat responses.</li>
                   </ul>
                </AlertDescription>
            </Alert>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Manage Collections</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="new-collection">Create Collection</Label>
                            <form onSubmit={handleCreateCollection} className="flex items-center gap-2">
                                <Input id="new-collection" placeholder="my-doc-set" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} disabled={isCreating} />
                                <Button type="submit" disabled={isCreating || !newCollectionName.trim()}>
                                    {isCreating ? <Loader2 className="animate-spin" /> : "Create"}
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Delete Collection</Label>
                            <div className="flex items-center gap-2">
                                <Select value={selectedCollection} onValueChange={setSelectedCollection} disabled={isLoadingCollections || isDeleting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingCollections ? "Loading..." : "Select collection"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="destructive" size="icon" onClick={handleDeleteCollection} disabled={isDeleting || !selectedCollection}>
                                    {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Upload Document</CardTitle>
                    <CardDescription>Upload a .txt or .docx file to the selected collection to be embedded.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form onSubmit={handleFileUpload} className="flex items-center gap-2">
                        <Input id="file-upload" type="file" accept=".txt,.docx" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} disabled={isUploading || !selectedCollection} />
                        <Button type="submit" size="icon" disabled={isUploading || !file || !selectedCollection}>
                            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                        </Button>
                    </form>
                    {!selectedCollection && <p className="text-xs text-muted-foreground mt-2">Select or create a collection to enable upload.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  systemPrompt,
  onSystemPromptChange,
  onModelsUpdate,
  onRagUpdate,
  connectionMode,
  onConnectionModeChange,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt || '');
  const [activeTab, setActiveTab] = useState("general");

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
      description: "This will be applied to new chat sessions.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] grid-rows-[auto_1fr] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure chat behavior, manage models, and set up your RAG system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="rag">RAG</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="flex-grow flex flex-col gap-6 py-4 overflow-y-auto">
             <div className="space-y-2 px-1">
                <Label>Connection Mode</Label>
                 <RadioGroup
                    value={connectionMode}
                    onValueChange={(value) => onConnectionModeChange(value as ConnectionMode)}
                    className="flex items-center space-x-4 pt-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="direct" id="s-direct" />
                        <Label htmlFor="s-direct" className="font-normal">Direct</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mcp" id="s-mcp" />
                        <Label htmlFor="s-mcp" className="font-normal">MCP</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rag" id="s-rag" />
                        <Label htmlFor="s-rag" className="font-normal">RAG</Label>
                    </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground pt-1">
                    Choose how to connect to your language models.
                </p>
             </div>
            <div className="space-y-2 flex-grow flex flex-col px-1">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="e.g., You are a helpful assistant that always replies in pirate speak."
                value={currentSystemPrompt}
                onChange={(e) => setCurrentSystemPrompt(e.target.value)}
                className="flex-grow text-sm min-h-[150px]"
              />
               <p className="text-sm text-muted-foreground">
                Sets the AI's behavior. In RAG mode, this can be used to augment the default context prompt.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="models" className="flex-grow flex flex-col gap-4 py-4 overflow-y-auto px-1">
             {connectionMode === 'mcp' ? (
                <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 rounded-lg p-6">
                    <Info className="w-10 h-10 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Model Management via MCP</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        To add, remove, or update models, please edit your MCP server's configuration and restart it.
                    </p>
                </div>
             ) : (
                <DirectModelManager onModelsUpdate={onModelsUpdate} />
             )}
          </TabsContent>

          <TabsContent value="rag" className="flex-grow flex flex-col gap-4 py-4 overflow-y-auto px-1">
              <RagManager onRagUpdate={onRagUpdate} />
          </TabsContent>
        </Tabs>
        </div>
        <DialogFooter className="mt-auto pt-4">
          <Button onClick={() => { handleSaveSystemPrompt(); onOpenChange(false); }}>Save and Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
