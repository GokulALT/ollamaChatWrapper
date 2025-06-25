"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Info } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string | null;
  onSystemPromptChange: (prompt: string | null) => void;
  onModelsUpdate: () => void; // This is kept for now to avoid breaking changes, but model management is removed.
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  systemPrompt,
  onSystemPromptChange,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(systemPrompt || '');

  useEffect(() => {
    if (systemPrompt !== null) {
      setCurrentSystemPrompt(systemPrompt);
    }
  }, [systemPrompt]);

  const handleSaveSystemPrompt = () => {
    const finalPrompt = currentSystemPrompt.trim();
    localStorage.setItem('system_prompt', finalPrompt);
    onSystemPromptChange(finalPrompt);
    toast({
      title: "System Prompt Saved",
      description: "Start a new chat to apply the changes.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] grid-rows-[auto_1fr_auto] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure chat settings. Model management is handled in your MCP server.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
        <Tabs defaultValue="chat-settings" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat-settings">Chat Settings</TabsTrigger>
            <TabsTrigger value="manage-models">Manage Models</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat-settings" className="flex-grow flex flex-col gap-4 py-4 overflow-y-auto">
            <div className="space-y-2 flex-grow flex flex-col">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                placeholder="e.g., You are a helpful assistant that always replies in pirate speak."
                value={currentSystemPrompt}
                onChange={(e) => setCurrentSystemPrompt(e.target.value)}
                className="flex-grow text-sm"
              />
              <p className="text-sm text-muted-foreground">
                The system prompt is sent to the model with every new conversation to set its behavior.
              </p>
            </div>
            <DialogFooter className="mt-auto pt-4">
              <Button onClick={handleSaveSystemPrompt}>Save and Close</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manage-models" className="flex-grow flex flex-col gap-4 py-4 overflow-hidden">
             <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 rounded-lg p-6">
                <Info className="w-10 h-10 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Model Management via MCP</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    To add, remove, or update models, please edit your Model Context Protocol (MCP) server's configuration file and restart the server.
                </p>
             </div>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
