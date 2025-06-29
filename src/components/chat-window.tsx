
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData, Source } from '@/types/chat';
import { ChatMessage } from '@/components/chat-message';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle, Loader2, MessageSquare, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { ConnectionMode } from '@/app/page';

interface ChatWindowProps {
  selectedModel: string | null;
  newChatKey: number;
  systemPrompt: string | null;
  connectionMode: ConnectionMode;
  selectedCollection: string | null;
}

const RESPONSE_SEPARATOR = '_--_SEPARATOR_--_';

export function ChatWindow({ selectedModel, newChatKey, systemPrompt, connectionMode, selectedCollection }: ChatWindowProps) {
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
  }, [newChatKey]);

  const handleMcpDirectChat = async (newMessages: ChatMessageData[]) => {
     const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || 'llama3', // Default to llama3 for RAG if none selected
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
            { id: currentAiMessageId, text: '', sender: 'ai', timestamp: new Date(), model: selectedModel || 'llama3', sources: sources || undefined },
          ]);
          aiMessageStarted = true;
        }

        if (aiMessageStarted) {
          setMessages((prev) => prev.map((msg) => msg.id === currentAiMessageId ? { ...msg, text: accumulatedData } : msg));
        }
      }
  };

  const sendMessage = async () => {
    const isRagReady = connectionMode === 'rag' && selectedCollection;
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
      return selectedCollection ? "Ask a question about your documents..." : "Please select a collection first."
    }
    return selectedModel ? "Type your message (Shift+Enter for new line)..." : "Please select a model first."
  }

  const isChatDisabled = () => {
    if (isLoading) return true;
    if (connectionMode === 'rag') return !selectedCollection;
    return !selectedModel;
  }

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
             <div className="text-center text-muted-foreground pt-10">
              {connectionMode === 'rag' ? <BrainCircuit size={40} className="mx-auto" /> : <MessageSquare size={40} className="mx-auto" />}
              <p className="mt-2">
                {connectionMode === 'rag' 
                  ? "You are in RAG mode. Ask questions about your documents." 
                  : "Start a conversation by typing below."
                }
              </p>
              {systemPrompt && (
                <p className="text-xs mt-4 italic max-w-md mx-auto">
                  System Prompt Active: "{systemPrompt.length > 100 ? `${systemPrompt.substring(0, 100)}...` : systemPrompt}"
                </p>
              )}
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length -1]?.sender === 'user' && ( 
            <div className="flex items-start gap-3 justify-start">
               <Card className="max-w-xs sm:max-w-md md:max-w-lg rounded-xl shadow-sm bg-card text-card-foreground">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span>Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-end gap-2" 
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={getPlaceholder()}
            className="flex-grow resize-none min-h-[40px] max-h-[200px] py-2 px-3" 
            rows={1} 
            disabled={isChatDisabled()}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || isChatDisabled()} aria-label="Send message">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
