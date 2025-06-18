
"use client";

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, WifiOff, Loader2, Cpu, MemoryStick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OllamaStatusState {
  online: boolean | null; // null for initial loading state
  message: string;
  cpuUsage: number | null;
  ramUsage: number | null;
}

export function OllamaStatus() {
  const [status, setStatus] = useState<OllamaStatusState>({
    online: null,
    message: 'Checking status...',
    cpuUsage: null,
    ramUsage: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ollama/status');
        const data = await response.json();
        setStatus({
          online: data.online,
          message: data.message,
          cpuUsage: Math.floor(Math.random() * 100), // Simulated CPU Usage
          ramUsage: Math.floor(Math.random() * 70) + 20, // Simulated RAM Usage (20-90%)
        });
      } catch (error) {
        console.error("Error fetching Ollama status:", error);
        setStatus({
          online: false,
          message: 'Failed to fetch status from API.',
          cpuUsage: Math.floor(Math.random() * 100),
          ramUsage: Math.floor(Math.random() * 70) + 20,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30000); // Check status every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-2 space-y-1 text-sm group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2">
        <Activity size={18} className="text-sidebar-foreground" />
        <h3 className="font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">Ollama Status</h3>
      </div>
      
      <div className="pl-1 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        {isLoading && status.online === null ? (
          <div className="flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin mr-1" /> Checking...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Cpu size={12} className="text-sidebar-foreground/70" />
              CPU Usage: {status.cpuUsage !== null ? `${status.cpuUsage}%` : 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <MemoryStick size={12} className="text-sidebar-foreground/70" />
              RAM Usage: {status.ramUsage !== null ? `${status.ramUsage}%` : 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              Status: {status.online ? (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 text-[0.7rem] px-1.5 py-0.5">
                  <CheckCircle2 size={10} className="mr-1" /> Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[0.7rem] px-1.5 py-0.5">
                  <WifiOff size={10} className="mr-1" /> Offline
                </Badge>
              )}
            </div>
            <p className={cn("mt-1 text-[0.7rem]", { 'text-red-600 dark:text-red-400': !status.online })}>
              {status.message}
            </p>
          </>
        )}
      </div>
      <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:mt-1 hidden">
        {isLoading && status.online === null ? (
            <Loader2 size={18} className="animate-spin text-sidebar-foreground" />
        ) : status.online ? (
            <CheckCircle2 size={18} className="text-green-500" />
        ) : (
            <WifiOff size={18} className="text-red-500" />
        )}
      </div>
    </div>
  );
}
