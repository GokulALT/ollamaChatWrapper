
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData, Source, ConnectionMode } from '@/types/chat';
import type { ChatMessage } from 'genkit';
import { ChatMessage as ChatMessageComponent } from '@/components/chat-message';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { getOllamaUrl, getMcpUrl, getChromaUrl, getTemperature } from '@/lib/config';

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

  const streamResponse = async (response: Response) => {
    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "Unknown error occurred");
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedResponse = '';
    const currentAiMessageId = Date.now().toString() + '-ai';
      
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: currentAiMessageId, text: '', sender: 'ai', timestamp: new Date(), model: selectedModel, sources: [] },
    ]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulatedResponse += chunk;

      let sources: Source[] | undefined = undefined;
      let responseText = accumulatedResponse;

      if (connectionMode === 'rag' && accumulatedResponse.includes(RESPONSE_SEPARATOR)) {
        const parts = accumulatedResponse.split(RESPONSE_SEPARATOR);
        try {
          sources = JSON.parse(parts[0]);
        } catch (e) {
            // It might be an incomplete JSON string, so we just wait for more data.
        }
        responseText = parts[1] || '';
      }

      setMessages((prev) => prev.map((msg) => 
        msg.id === currentAiMessageId 
          ? { ...msg, text: responseText, sources: sources || msg.sources } 
          : msg
      ));
    }
  };

  const sendMessage = async () => {
    const isRagReady = connectionMode === 'rag' && selectedCollection && selectedModel;
    const isReady = connectionMode !== 'rag' && selectedModel;
    if (!input.trim() || isLoading || (!isRagReady && !isReady)) return;

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
      // Map our internal chat message format to Genkit's format for the unified API
      const apiMessages: ChatMessage[] = newMessages.map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user', // Use 'model' role for AI messages
        content: [{ text: msg.text }],
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionMode,
          model: selectedModel,
          messages: apiMessages,
          systemPrompt,
          temperature: getTemperature(),
          collection: selectedCollection,
        }),
        signal: abortControllerRef.current!.signal,
      });

      await streamResponse(response);

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
      if (!selectedCollection) return "Please select a collection first."
      if (!selectedModel) return "Please select a model to continue."
      return "Ask a question about your documents...";
    }
    return selectedModel ? "Type your message (Shift+Enter for new line)..." : "Please select a model first."
  }

  const isChatDisabled = () => {
    if (isLoading) return true;
    if (connectionMode === 'rag') return !selectedCollection || !selectedModel;
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
            <ChatMessageComponent key={msg.id} message={msg} />
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
