"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Terminal, CheckCircle2, AlertCircle, ServerCrash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export function OllamaStatus() {
  const [systemStatus, setSystemStatus] = useState({
    online: true,
    cpuUsage: '0%',
    memoryUsage: '0GB / 0GB',
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Simulate fetching initial status and logs
    setSystemStatus({
      online: true,
      cpuUsage: '35%',
      memoryUsage: '4.2GB / 16GB',
    });
    setLogs([
      { id: 1, timestamp: new Date(Date.now() - 5000), message: "Model 'Llama 3 8B' loaded.", level: 'info' },
      { id: 2, timestamp: new Date(Date.now() - 60000), message: "System initialized successfully.", level: 'info' },
      { id: 3, timestamp: new Date(Date.now() - 120000), message: "Checking for model updates...", level: 'info' },
      { id: 4, timestamp: new Date(Date.now() - 180000), message: "High memory usage detected.", level: 'warn' },
    ]);

    // Simulate live updates - in a real app, this could be WebSockets or polling
    const intervalId = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        cpuUsage: `${Math.floor(Math.random() * 60) + 20}%`, // Random CPU between 20-80%
      }));
      if (Math.random() < 0.1) { // Occasionally add a new log
        setLogs(prevLogs => [{
          id: Date.now(),
          timestamp: new Date(),
          message: Math.random() > 0.5 ? "Heartbeat check OK." : "Periodic task executed.",
          level: 'info'
        }, ...prevLogs.slice(0,19) // Keep last 20 logs
      ]);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const getLogLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <CheckCircle2 size={12} className="text-green-500 mr-1" />;
      case 'warn': return <AlertCircle size={12} className="text-yellow-500 mr-1" />;
      case 'error': return <ServerCrash size={12} className="text-red-500 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="p-2 space-y-3 text-sm group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2">
        <Activity size={18} className="text-sidebar-foreground" />
        <h3 className="font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">System Status</h3>
      </div>
      <div className="space-y-1 pl-2 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-1.5">
          Status: {systemStatus.online ? (
            <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 text-xs px-1.5 py-0.5">
              <CheckCircle2 size={12} className="mr-1" /> Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              <AlertCircle size={12} className="mr-1" /> Offline
            </Badge>
          )}
        </div>
        <p>CPU: {systemStatus.cpuUsage}</p>
        <p>Memory: {systemStatus.memoryUsage}</p>
      </div>

      <Separator className="my-2 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
      
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
        <Terminal size={18} className="text-sidebar-foreground" />
        <h3 className="font-medium text-sidebar-foreground">Recent Logs</h3>
      </div>
      <ScrollArea className="h-24 pl-2 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
        <ul className="space-y-1.5">
          {logs.map(log => (
            <li key={log.id} className="truncate flex items-center">
              {getLogLevelIcon(log.level)}
              <span className="text-sidebar-foreground/60 mr-1">[{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> 
              <span className={cn({
                'text-yellow-600 dark:text-yellow-400': log.level === 'warn',
                'text-red-600 dark:text-red-400': log.level === 'error',
              })}>{log.message}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
