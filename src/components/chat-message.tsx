
"use client";

import React, { useState } from 'react';
import type { ChatMessageData } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, BookCopy, Clipboard, Check, Eye, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const { toast } = useToast();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
      toast({
        description: "Code copied to clipboard.",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy code to clipboard.",
      });
    });
  };

  const handleSave = (codeText: string, lang: string) => {
    const extension = lang || 'txt';
    const suggestedFilename = `snippet-${Date.now()}.${extension}`;
    const filename = window.prompt("Enter filename:", suggestedFilename);

    if (filename) {
      try {
        const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          description: `File "${filename}" saved successfully.`,
        });
      } catch (error) {
        console.error("Failed to save file:", error);
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Could not save the file.",
        });
      }
    }
  };

  const CodeRenderer = ({ node, inline, className, children, ...props }: any) => {
    const [showPreview, setShowPreview] = useState(false);
    const codeText = String(children).replace(/\n$/, '');
    const codeId = React.useId();
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    if (inline) {
      return (
        <code className={cn(className, 'bg-muted px-1 py-0.5 rounded text-xs')} {...props}>
          {children}
        </code>
      );
    }
    
    const isHtml = lang === 'html';

    return (
      <div className="relative group my-2">
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isHtml && (
             <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide Preview" : "Show Preview"}
            >
              <Eye size={14} />
              <span className="sr-only">Toggle Preview</span>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => handleSave(codeText, lang)}
            title="Save to file"
          >
            <Download size={14} />
            <span className="sr-only">Save code to file</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => handleCopy(codeText, codeId)}
            title="Copy code"
          >
            {copiedStates[codeId] ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Clipboard size={14} />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
        <pre className={cn(className, 'bg-muted p-2 rounded-md overflow-x-auto text-xs pt-8')} {...props}>
          <code>{children}</code>
        </pre>
        {isHtml && showPreview && (
          <div className="mt-2 rounded-md border">
            <iframe
              srcDoc={codeText}
              className="w-full h-64 rounded-md bg-white"
              sandbox="allow-scripts allow-modals"
              title="HTML Preview"
            />
          </div>
        )}
      </div>
    );
  };

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
          'max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-xl shadow-sm',
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
              code: CodeRenderer,
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
                          <p className="truncate text-muted-foreground">Source {index + 1}: {source.metadata.source || 'unknown'}</p>
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
