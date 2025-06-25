
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData } from '@/types/chat';
import { ChatMessage } from '@/components/chat-message';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { ConnectionMode } from '@/app/page';

interface ChatWindowProps {
  selectedModel: string | null;
  newChatKey: number;
  systemPrompt: string | null;
  connectionMode: ConnectionMode;
}

export function ChatWindow({ selectedModel, newChatKey, systemPrompt, connectionMode }: ChatWindowProps) {
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

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel || isLoading) return;

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(m => ({ sender: m.sender, text: m.text })), 
          system: systemPrompt,
          connectionMode: connectionMode,
        }),
        signal: controller.signal,
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
        {
          id: currentAiMessageId,
          text: '',
          sender: 'ai',
          timestamp: new Date(),
          model: selectedModel,
        },
      ]);

      let accumulatedResponse = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === currentAiMessageId
              ? { ...msg, text: accumulatedResponse }
              : msg
          )
        );
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
        // Remove the empty AI message bubble on error
        setMessages(prev => prev.filter(m => m.id !== (Date.now().toString() + '-ai') && m.text.length > 0));
      }
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return;
      } else {
        event.preventDefault();
        sendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-10">
              <MessageSquare size={40} className="mx-auto" />
              <p className="mt-2">Start a conversation by typing below.</p>
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
        {selectedModel ? (
          <form
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2" 
          >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Type your message (Shift+Enter for new line)..."
                className="flex-grow resize-none min-h-[40px] max-h-[200px] py-2 px-3" 
                rows={1} 
                disabled={isLoading}
                aria-label="Chat input"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
                <Send size={18} />
              </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AlertTriangle size={18} />
            <p>Please select a model from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
