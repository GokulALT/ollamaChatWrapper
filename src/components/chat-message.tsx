
"use client";

import type { ChatMessageData } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, BookCopy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-xs sm:max-w-md md:max-w-lg rounded-xl shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
        )}
      >
        <CardContent className="p-3 text-sm">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-xl font-semibold my-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-semibold my-1.5" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-base font-semibold my-1" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside my-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1" {...props} />,
              li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
              p: ({node, ...props}) => <p className="mb-1" {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <pre className={cn(className, 'bg-muted p-2 rounded-md overflow-x-auto text-xs my-1')} {...props}>
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className={cn(className, 'bg-muted px-1 py-0.5 rounded text-xs')} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.text}
          </ReactMarkdown>

          {message.sources && message.sources.length > 0 && (
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="item-1" className="border-t pt-2">
                <AccordionTrigger className="text-xs py-1 hover:no-underline [&[data-state=open]>svg]:text-primary">
                  <div className="flex items-center gap-1.5">
                    <BookCopy size={12} />
                    Show Context ({message.sources.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-32 mt-2">
                    <div className="space-y-2 pr-4">
                      {message.sources.map((source, index) => (
                        <div key={index} className="p-2 bg-muted/50 rounded-md text-xs">
                          <p className="truncate text-muted-foreground">Source {index + 1}</p>
                          <p className="mt-1 whitespace-pre-wrap">{source.pageContent}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <p className="text-xs mt-2 opacity-70">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.model && !isUser && ` · ${message.model}`}
          </p>
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
