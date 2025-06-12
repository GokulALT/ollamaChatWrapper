"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { ChatMessageData } from '@/types/chat';
import { ChatMessage } from '@/components/chat-message';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ChatWindowProps {
  selectedModel: string | null;
}

export function ChatWindow({ selectedModel }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

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
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    // In a real app, this would be an API call to Genkit flow interacting with Ollama
    setTimeout(() => {
      const aiResponse: ChatMessageData = {
        id: Date.now().toString() + '-ai',
        text: `This is a mock response from ${selectedModel} to your message: "${userMessage.text.substring(0, 50)}${userMessage.text.length > 50 ? '...' : ''}"`,
        sender: 'ai',
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1500 + Math.random() * 1000); // Add some randomness to simulate network
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
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
