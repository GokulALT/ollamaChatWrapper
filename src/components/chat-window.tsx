
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData } from '@/types/chat';
import { ChatMessage } from '@/components/chat-message';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  selectedModel: string | null;
}

export function ChatWindow({ selectedModel }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel) return;

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

    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(m => ({ sender: m.sender, text: m.text })), // Send relevant parts
        }),
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
      console.error("Error sending message to Ollama:", err);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: err.message || "Failed to get response from the AI.",
      });
      // Optionally remove the pending AI message or mark it as error
       setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== userMessage.id + "-pending-ai"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length -1]?.sender === 'user' && ( // Show loader only if last message is user and we are waiting
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
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow"
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
