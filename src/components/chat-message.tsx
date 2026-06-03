
"use client";

import type { ChatMessageData } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, BookCopy, Copy, Check, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useState } from 'react';

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeAgo = () => {
    const now = new Date();
    const diff = now.getTime() - message.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return message.timestamp.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary border-primary/20">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col gap-1 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <Card
          className={cn(
            'rounded-2xl shadow-sm transition-all hover:shadow-md',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card text-card-foreground rounded-tl-sm border-primary/10'
          )}
        >
          <CardContent className="p-4 text-sm">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold my-3" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold my-2.5" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-semibold my-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                a: ({node, ...props}) => (
                  <a
                    className={cn(
                      "underline underline-offset-2 transition-colors",
                      isUser ? "hover:text-primary-foreground/80" : "hover:text-primary"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="relative group">
                      <pre className={cn(
                        className,
                        'bg-muted p-4 rounded-xl overflow-x-auto text-xs my-3 border',
                        isUser ? 'border-primary-foreground/20' : 'border-border'
                      )} {...props}>
                        <code>{children}</code>
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigator.clipboard.writeText(String(children))}
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                  ) : (
                    <code className={cn(
                      className,
                      'px-1.5 py-0.5 rounded text-xs font-mono',
                      isUser
                        ? 'bg-primary-foreground/20'
                        : 'bg-muted'
                    )} {...props}>
                      {children}
                    </code>
                  )
                },
                blockquote: ({node, ...props}) => (
                  <blockquote
                    className={cn(
                      "border-l-4 pl-4 my-3 italic",
                      isUser ? 'border-primary-foreground/30' : 'border-primary/30'
                    )}
                    {...props}
                  />
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>

            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline [&[data-state=open]>svg]:text-primary">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <BookCopy size={12} className="text-primary" />
                        </div>
                        <span className="font-medium">
                          {message.sources.length} {message.sources.length === 1 ? 'source' : 'sources'} referenced
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-40 mt-2">
                        <div className="space-y-2 pr-2">
                          {message.sources.map((source, index) => (
                            <div
                              key={index}
                              className="p-3 bg-muted/50 rounded-lg text-xs border border-border/50 hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-semibold text-primary">Source {index + 1}</span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                {source.pageContent}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>

        <div
          className={cn(
            "flex items-center gap-2 text-[11px] px-1",
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <div className="flex items-center gap-1 text-muted-foreground/70">
            <Clock size={10} />
            <span>{getTimeAgo()}</span>
          </div>
          {message.model && !isUser && (
            <span className="text-muted-foreground/70">· {message.model}</span>
          )}
          {!isUser && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-muted/50"
              onClick={handleCopy}
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </Button>
          )}
        </div>
      </div>
      {isUser && (
        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary-foreground border-secondary/20">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
