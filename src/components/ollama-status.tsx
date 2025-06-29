
"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConnectionMode } from '@/types/chat';

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
  const serverName = connectionMode.toUpperCase();

  useEffect(() => {
    const fetchStatus = async () => {
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
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30000); // Check status every 30 seconds

    return () => clearInterval(intervalId);
  }, [connectionMode, serverName]);

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-muted-foreground">{serverName} Status</h3>
      <div className="text-xs">
        {status.online === null ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 size={12} className="animate-spin mr-1" /> Checking...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              Status: {status.online ? (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">
                  <CheckCircle2 size={10} className="mr-1" /> Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff size={10} className="mr-1" /> Offline
                </Badge>
              )}
            </div>
            <p className={cn("mt-1", { 'text-red-600 dark:text-red-400': !status.online })}>
              {status.message}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
