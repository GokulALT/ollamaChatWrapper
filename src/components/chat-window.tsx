
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData, Source, ConnectionMode } from '@/types/chat';
import { ChatMessage } from '@/components/chat-message';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle, Loader2, MessageSquare, BrainCircuit, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { getOllamaUrl, getMcpUrl, getChromaUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  selectedModel: string | null;
  connectionMode: ConnectionMode;
  newChatKey: number;
  systemPrompt: string | null;
  selectedCollection: string | null;
}

const RESPONSE_SEPARATOR = '_--_SEPARATOR_--_';

export function ChatWindow({ selectedModel, connectionMode, newChatKey, systemPrompt, selectedCollection }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialRenderRef = useRef(true);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, [newChatKey, connectionMode]);

  const handleMcpDirectChat = async (newMessages: ChatMessageData[]) => {
     const baseUrl = connectionMode === 'mcp' ? getMcpUrl() : getOllamaUrl();
     const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Ollama-Url': baseUrl,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(m => ({ sender: m.sender, text: m.text })), 
          system: systemPrompt,
          connectionMode: connectionMode,
        }),
        signal: abortControllerRef.current!.signal,
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error occurred"}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAiMessageId = Date.now().toString() + '-ai';
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: currentAiMessageId, text: '', sender: 'ai', timestamp: new Date(), model: selectedModel },
      ]);

      let accumulatedResponse = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setMessages((prev) => prev.map((msg) => msg.id === currentAiMessageId ? { ...msg, text: accumulatedResponse } : msg));
      }
  };

  const handleRagChat = async (newMessages: ChatMessageData[]) => {
      const response = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Ollama-Url': getOllamaUrl(),
          'X-Chroma-Url': getChromaUrl(),
        },
        body: JSON.stringify({
          model: selectedModel,
          collection: selectedCollection,
          messages: newMessages.map(m => ({ sender: m.sender, text: m.text })),
          system: systemPrompt,
        }),
        signal: abortControllerRef.current!.signal,
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedData = '';
      let sources: Source[] | null = null;
      let aiMessageStarted = false;
      const currentAiMessageId = Date.now().toString() + '-ai-rag';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulatedData += decoder.decode(value, { stream: true });
        
        if (!sources && accumulatedData.includes(RESPONSE_SEPARATOR)) {
          const parts = accumulatedData.split(RESPONSE_SEPARATOR);
          try {
            sources = JSON.parse(parts[0]);
            accumulatedData = parts.slice(1).join(RESPONSE_SEPARATOR);
          } catch (e) {
            console.error("Could not parse sources from stream:", e);
            // In case of parsing error, treat the whole thing as text content
            sources = []; 
          }
        }

        if (sources && !aiMessageStarted) {
           setMessages((prev) => [
            ...prev,
            { id: currentAiMessageId, text: '', sender: 'ai', timestamp: new Date(), model: selectedModel, sources: sources || undefined },
          ]);
          aiMessageStarted = true;
        }

        if (aiMessageStarted) {
          setMessages((prev) => prev.map((msg) => msg.id === currentAiMessageId ? { ...msg, text: accumulatedData } : msg));
        }
      }
  };

  const sendMessage = async () => {
    const isRagReady = connectionMode === 'rag' && selectedCollection && selectedModel;
    const isDirectReady = connectionMode !== 'rag' && selectedModel;
    if (!input.trim() || isLoading || (!isRagReady && !isDirectReady)) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString() + '-user',
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      if (connectionMode === 'rag') {
        await handleRagChat(newMessages);
      } else {
        await handleMcpDirectChat(newMessages);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted.');
      } else {
        console.error("Error sending message to API:", err);
        toast({
          variant: "destructive",
          title: "Chat Error",
          description: err.message || "Failed to get response from the AI.",
        });
        setMessages(prev => prev.filter(m => m.sender === 'user' || m.text.length > 0));
      }
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  
  const getPlaceholder = () => {
    if (connectionMode === 'rag') {
      if (!selectedCollection) return "Select a collection to start asking questions about your documents..."
      if (!selectedModel) return "Select a model to continue..."
      return "Ask a question about your documents...";
    }
    return selectedModel ? "Type your message (Shift+Enter for new line)..." : "Select a model to start chatting..."
  }

  const isChatDisabled = () => {
    if (isLoading) return true;
    if (connectionMode === 'rag') return !selectedCollection || !selectedModel;
    return !selectedModel;
  }

  const clearInput = () => {
    setInput('');
  };

  const getEmptyStateContent = () => {
    if (connectionMode === 'rag') {
      return {
        icon: BrainCircuit,
        title: 'Ready to Explore Your Documents',
        description: 'Select a collection and model, then ask questions about your uploaded documents. The AI will provide answers with relevant context.',
        suggestions: [
          'What are the main topics in this document?',
          'Summarize the key findings',
          'What data is available about X?',
        ],
      };
    }
    return {
      icon: Sparkles,
      title: 'Start a Conversation',
      description: 'Select a model and begin chatting. Ask questions, get creative help, or explore ideas with AI assistance.',
      suggestions: [
        'Explain a complex concept',
        'Help me brainstorm ideas',
        'Write something for me',
      ],
    };
  };

  const emptyState = getEmptyStateContent();
  const EmptyIcon = emptyState.icon;

  return (
    <div className="flex flex-col h-full max-h-full bg-gradient-to-b from-background to-muted/20">
      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={cn(
                "p-6 rounded-2xl mb-6",
                connectionMode === 'rag' ? "bg-green-500/10" : "bg-purple-500/10"
              )}>
                <EmptyIcon size={64} className={cn(
                  connectionMode === 'rag' ? "text-green-500" : "text-purple-500"
                )} />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">{emptyState.title}</h2>
              <p className="text-muted-foreground max-w-md mb-8">{emptyState.description}</p>

              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {emptyState.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-sm hover:bg-primary/10 hover:border-primary/30 transition-all"
                    disabled={isChatDisabled()}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>

              {systemPrompt && (
                <div className="w-full max-w-lg">
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-primary" />
                      <span className="text-sm font-medium">Active System Prompt</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      "{systemPrompt.length > 150 ? `${systemPrompt.substring(0, 150)}...` : systemPrompt}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && messages[messages.length - 1]?.sender === 'user' && (
            <div className="flex items-start gap-3 justify-start animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
               <Card className="max-w-xs sm:max-w-md md:max-w-lg rounded-2xl shadow-sm bg-card text-card-foreground border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Thinking</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          <div className="flex-grow relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={getPlaceholder()}
              className="flex-grow resize-none min-h-[52px] max-h-[200px] py-3 pr-10 rounded-2xl border-2 focus:border-primary/50 transition-all"
              rows={1}
              disabled={isChatDisabled()}
              aria-label="Chat input"
            />
            {input && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-muted/50"
                onClick={clearInput}
                disabled={isLoading}
              >
                <X size={14} />
              </Button>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              !input.trim() || isChatDisabled()
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 hover:shadow-lg"
            )}
            disabled={isLoading || !input.trim() || isChatDisabled()}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
