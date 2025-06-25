
"use client";

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConnectionMode } from '@/app/page';

interface StatusState {
  online: boolean | null; // null for initial loading state
  message: string;
}

interface OllamaStatusProps {
    connectionMode: ConnectionMode;
}

export function OllamaStatus({ connectionMode }: OllamaStatusProps) {
  const [status, setStatus] = useState<StatusState>({
    online: null,
    message: 'Checking status...',
  });
  const [isLoading, setIsLoading] = useState(true);
  const serverName = connectionMode.toUpperCase();

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ollama/status?mode=${connectionMode}`);
        const data = await response.json();
        setStatus({
          online: data.online,
          message: data.message,
        });
      } catch (error) {
        console.error(`Error fetching ${serverName} status:`, error);
        setStatus({
          online: false,
          message: 'Failed to fetch status from API.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30000); // Check status every 30 seconds

    return () => clearInterval(intervalId);
  }, [connectionMode, serverName]);

  return (
    <div className="p-2 space-y-1 text-sm group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2">
        <Activity size={18} className="text-sidebar-foreground" />
        <h3 className="font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">{serverName} Status</h3>
      </div>
      
      <div className="pl-1 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        {isLoading && status.online === null ? (
          <div className="flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin mr-1" /> Checking...
          </div>
        ) : (
          <>
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
            <p className={cn("mt-1 text-[0.7rem] break-words w-[170px]", { 'text-red-600 dark:text-red-400': !status.online })}>
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
