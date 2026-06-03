
"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Info, Trash2, Loader2, DownloadCloud, Upload, Database, ArrowLeft, Sparkles, Server, Cpu, RefreshCw, Zap } from 'lucide-react';
import type { ConnectionMode } from '@/types/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { getOllamaUrl, setOllamaUrl, getMcpUrl, setMcpUrl, getChromaUrl, setChromaUrl } from '@/lib/config';
import { cn } from '@/lib/utils';


interface Model {
    name: string;
    size: number;
}

function DirectModelManager() {
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
            const res = await fetch('/api/ollama/models?mode=direct', {
                headers: { 'X-Ollama-Url': getOllamaUrl() }
            });
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Ollama-Url': getOllamaUrl()
                },
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Ollama-Url': getOllamaUrl()
                },
                body: JSON.stringify({ name: modelName }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: "Model Deleted", description: `${modelName} has been removed.` });
            await fetchModels();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setDeletingModel(null);
        }
    };

    const formatSize = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="space-y-6">
            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <DownloadCloud size={20} className="text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Pull a New Model</CardTitle>
                            <CardDescription className="text-xs">Download models from the Ollama registry</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePullModel} className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                id="pull-model"
                                placeholder="e.g., llama3:8b, mistral:7b"
                                value={pullModelName}
                                onChange={e => setPullModelName(e.target.value)}
                                disabled={isPulling}
                                className="flex-grow"
                            />
                            <Button
                                type="submit"
                                disabled={isPulling || !pullModelName.trim()}
                                className={cn(
                                    "min-w-[100px]",
                                    isPulling && "animate-pulse"
                                )}
                            >
                                {isPulling ? <Loader2 className="animate-spin mr-2" size={16} /> : <DownloadCloud size={16} className="mr-2" />}
                                {isPulling ? 'Pulling...' : 'Pull'}
                            </Button>
                        </div>
                        {isPulling && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="truncate">{pullStatus}</span>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Cpu size={20} className="text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Local Models</CardTitle>
                                <CardDescription className="text-xs">Manage your downloaded models</CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchModels}
                            disabled={isLoading}
                            title="Refresh models"
                        >
                            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32 space-y-4">
                            <div className="text-center space-y-2">
                                <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                                <p className="text-sm text-muted-foreground">Loading models...</p>
                            </div>
                        </div>
                    ) : models.length > 0 ? (
                        <div className="space-y-2">
                            {models.map(model => (
                                <div
                                    key={model.name}
                                    className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Server size={16} className="text-primary" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">{model.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatSize(model.size)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDeleteModel(model.name)}
                                        disabled={!!deletingModel}
                                    >
                                        {deletingModel === model.name ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center space-y-3">
                            <div className="p-3 rounded-full bg-muted">
                                <Server size={24} className="text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">No models found</p>
                                <p className="text-xs text-muted-foreground">Pull a model above to get started</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function RagManager() {
    const { toast } = useToast();
    const [collections, setCollections] = useState<{id: string, name: string}[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [newDbName, setNewDbName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);

    const fetchCollections = useCallback(async () => {
        setIsLoadingCollections(true);
        try {
            const res = await fetch('/api/rag/collections', {
                headers: { 'X-Chroma-Url': getChromaUrl() }
            });
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
        if (!newDbName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/rag/collections', {
                method: 'POST',
                body: JSON.stringify({ name: newDbName }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Chroma-Url': getChromaUrl()
                }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: 'Database Created', description: `Successfully created database "${newDbName}".` });
            setNewDbName('');
            await fetchCollections();
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
             const res = await fetch(`/api/rag/collections?name=${selectedCollection}`, {
                method: 'DELETE',
                headers: { 'X-Chroma-Url': getChromaUrl() }
             });
             if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            toast({ title: 'Database Deleted', description: `Successfully deleted "${selectedCollection}".` });
            setSelectedCollection('');
            await fetchCollections();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !selectedCollection) {
            toast({ variant: 'destructive', title: "Upload Error", description: "Please select a database and a file." });
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
                headers: {
                    'X-Ollama-Url': getOllamaUrl(),
                    'X-Chroma-Url': getChromaUrl(),
                }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "An unknown error occurred during upload.");
            }
            const result = await res.json();
            toast({ title: "Upload Successful", description: `${result.count} chunks added to database "${selectedCollection}".` });
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
        <div className="space-y-6">
            <Alert className="border-primary/20 bg-primary/5">
                <Database className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">RAG Mode Requirements</AlertTitle>
                <AlertDescription className="text-xs">
                   RAG mode requires two services running locally:
                   <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong className="text-foreground">ChromaDB Server</strong> - Vector database for document storage and retrieval</li>
                        <li><strong className="text-foreground">Ollama</strong> - Handles document embedding and generates responses</li>
                   </ul>
                   Configure service URLs in the <span className="font-medium">General</span> tab.
                </AlertDescription>
            </Alert>

            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Database size={20} className="text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Manage Databases</CardTitle>
                            <CardDescription className="text-xs">Create and delete ChromaDB collections</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="new-collection">Create New Database</Label>
                            <form onSubmit={handleCreateCollection} className="flex gap-2">
                                <Input
                                    id="new-collection"
                                    placeholder="e.g., project-docs"
                                    value={newDbName}
                                    onChange={e => setNewDbName(e.target.value)}
                                    disabled={isCreating}
                                    className="flex-grow"
                                />
                                <Button
                                    type="submit"
                                    disabled={isCreating || !newDbName.trim()}
                                    className={cn("min-w-[80px]", isCreating && "animate-pulse")}
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={16} /> : "Create"}
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-2">
                            <Label>Delete Database</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={selectedCollection}
                                    onValueChange={setSelectedCollection}
                                    disabled={isLoadingCollections || isDeleting}
                                >
                                    <SelectTrigger className="flex-grow">
                                        <SelectValue placeholder={isLoadingCollections ? "Loading..." : "Select database"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map(c => (
                                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={handleDeleteCollection}
                                    disabled={isDeleting || !selectedCollection}
                                    className="min-w-[40px]"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Upload size={20} className="text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Upload Documents</CardTitle>
                            <CardDescription className="text-xs">Add documents to your selected database</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <form onSubmit={handleFileUpload} className="flex gap-2">
                        <Input
                            id="file-upload"
                            type="file"
                            accept=".txt,.html,.ts,.scss,.css,.json,.md"
                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                            disabled={isUploading || !selectedCollection}
                            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        <Button
                            type="submit"
                            disabled={isUploading || !file || !selectedCollection}
                            className={cn("min-w-[80px]", isUploading && "animate-pulse")}
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} className="mr-2" />}
                            Upload
                        </Button>
                    </form>
                    {!selectedCollection && (
                        <Alert>
                            <AlertDescription className="text-xs">
                                Select or create a database above to enable document uploads.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="text-xs text-muted-foreground">
                        <p>Supported formats: .txt, .html, .ts, .scss, .css, .json, .md</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>('direct');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [activeTab, setActiveTab] = useState("general");

    // State for connection URLs
    const [ollamaUrl, setOllamaUrlState] = useState('');
    const [mcpUrl, setMcpUrlState] = useState('');
    const [chromaUrl, setChromaUrlState] = useState('');


    useEffect(() => {
        try {
            const storedMode = localStorage.getItem('connection_mode') as ConnectionMode;
            if (storedMode && ['direct', 'mcp', 'rag'].includes(storedMode)) {
                setConnectionMode(storedMode);
            }
            const storedPrompt = localStorage.getItem('system_prompt');
            if (storedPrompt) {
                setSystemPrompt(storedPrompt);
            }
            // Load URLs from our config helpers
            setOllamaUrlState(getOllamaUrl());
            setMcpUrlState(getMcpUrl());
            setChromaUrlState(getChromaUrl());

        } catch (error) {
            console.warn("Could not access localStorage.");
        }
    }, []);

    const handleSystemPromptChange = (prompt: string) => {
        setSystemPrompt(prompt);
        try {
            localStorage.setItem('system_prompt', prompt.trim());
        } catch (error) {
            console.warn("Could not access localStorage to set system prompt.");
        }
    };

    const handleConnectionModeChange = (mode: ConnectionMode) => {
        setConnectionMode(mode);
        try {
            localStorage.setItem('connection_mode', mode);
        } catch (error) {
            console.warn("Could not access localStorage.");
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
            <header className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                     <Button asChild variant="ghost" size="icon" className="hover:bg-muted/50" aria-label="Back to Chat">
                        <Link href="/">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Settings</h1>
                        <p className="text-sm text-muted-foreground">Configure your AI chat experience</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-y-auto p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger
                            value="general"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="models"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Models
                        </TabsTrigger>
                        <TabsTrigger
                            value="rag"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            RAG
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                        <Card className="border-primary/10">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Sparkles size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Chat Configuration</CardTitle>
                                        <CardDescription>Customize your chat experience</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Connection Mode</Label>
                                    <RadioGroup
                                        value={connectionMode}
                                        onValueChange={(value) => handleConnectionModeChange(value as ConnectionMode)}
                                        className="grid grid-cols-3 gap-3 pt-2"
                                    >
                                        <div className="relative">
                                            <RadioGroupItem value="direct" id="s-direct" className="sr-only peer" />
                                            <Label
                                                htmlFor="s-direct"
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                    "hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                                                    "peer-data-[state=checked]:text-primary"
                                                )}
                                            >
                                                <Zap size={24} className="mb-2" />
                                                <span className="font-semibold">Direct</span>
                                                <span className="text-xs text-muted-foreground mt-1">Local Ollama</span>
                                            </Label>
                                        </div>
                                        <div className="relative">
                                            <RadioGroupItem value="mcp" id="s-mcp" className="sr-only peer" />
                                            <Label
                                                htmlFor="s-mcp"
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                    "hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                                                    "peer-data-[state=checked]:text-primary"
                                                )}
                                            >
                                                <Sparkles size={24} className="mb-2" />
                                                <span className="font-semibold">MCP</span>
                                                <span className="text-xs text-muted-foreground mt-1">Via Server</span>
                                            </Label>
                                        </div>
                                        <div className="relative">
                                            <RadioGroupItem value="rag" id="s-rag" className="sr-only peer" />
                                            <Label
                                                htmlFor="s-rag"
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                    "hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                                                    "peer-data-[state=checked]:text-primary"
                                                )}
                                            >
                                                <Database size={24} className="mb-2" />
                                                <span className="font-semibold">RAG</span>
                                                <span className="text-xs text-muted-foreground mt-1">With Context</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    <p className="text-sm text-muted-foreground">
                                        Choose how to connect to your language models and retrieve context.
                                    </p>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <Label htmlFor="system-prompt" className="text-sm font-medium">System Prompt</Label>
                                    <Textarea
                                        id="system-prompt"
                                        placeholder="e.g., You are a helpful assistant that always replies in a friendly and concise manner."
                                        value={systemPrompt}
                                        onChange={(e) => handleSystemPromptChange(e.target.value)}
                                        className="text-sm min-h-[120px] resize-none"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Define the AI's behavior and personality. In RAG mode, this augments the retrieved context.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="px-2 py-1 rounded bg-muted">Length: {systemPrompt.length} characters</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Server size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Connection Endpoints</CardTitle>
                                        <CardDescription>Configure service URLs (saved in browser)</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ollama-url" className="text-sm">Ollama URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="ollama-url"
                                            value={ollamaUrl}
                                            onChange={(e) => { setOllamaUrlState(e.target.value); setOllamaUrl(e.target.value); }}
                                            placeholder="http://localhost:11434"
                                            className="flex-grow"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Used for Direct mode and RAG embeddings</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mcp-url" className="text-sm">MCP Server URL</Label>
                                    <Input
                                        id="mcp-url"
                                        value={mcpUrl}
                                        onChange={(e) => { setMcpUrlState(e.target.value); setMcpUrl(e.target.value); }}
                                        placeholder="http://localhost:8008"
                                    />
                                    <p className="text-xs text-muted-foreground">MCP-compatible HTTP server endpoint</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chroma-url" className="text-sm">ChromaDB URL</Label>
                                    <Input
                                        id="chroma-url"
                                        value={chromaUrl}
                                        onChange={(e) => { setChromaUrlState(e.target.value); setChromaUrl(e.target.value); }}
                                        placeholder="http://localhost:8000"
                                    />
                                    <p className="text-xs text-muted-foreground">Vector database for RAG mode</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="models" className="space-y-6">
                        {connectionMode === 'mcp' ? (
                            <Card className="border-primary/10">
                                <CardContent className="flex flex-col items-center justify-center h-full text-center py-16">
                                    <div className="p-4 rounded-full bg-muted mb-4">
                                        <Info className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Model Management via MCP</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                                        Models are managed by your MCP server configuration. Edit your server config and restart to make changes.
                                    </p>
                                    <Button asChild variant="outline">
                                        <Link href="/">Back to Chat</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                         ) : (
                            <DirectModelManager />
                         )}
                    </TabsContent>

                    <TabsContent value="rag" className="space-y-6">
                          <RagManager />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
