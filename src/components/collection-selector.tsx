
"use client";

import React, { useState, useEffect } from 'react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, AlertTriangle } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
}

interface CollectionSelectorProps {
  selectedCollection: string | null;
  onSelectCollection: (collectionName: string | null) => void;
  refreshKey?: number;
}

export function CollectionSelector({ selectedCollection, onSelectCollection, refreshKey }: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/rag/collections`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch: ${response.statusText}`);
        }
        const availableCollections: Collection[] = await response.json();
        
        setCollections(availableCollections);

        if (availableCollections.length > 0 && selectedCollection && !availableCollections.some(c => c.name === selectedCollection)) {
          onSelectCollection(null);
        } else if (availableCollections.length === 0) {
          onSelectCollection(null);
        }

      } catch (err: any) {
        console.error("Error fetching collections:", err);
        setError(err.message || `Could not load collections.`);
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:py-0">
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Available Collections</SidebarGroupLabel>
        <SidebarGroupContent>
          {isLoading && (
            <SidebarMenu>
              {[1, 2].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center w-full p-2">
                      <Database size={18} className="mr-2 text-muted-foreground" />
                      <Skeleton className="h-4 w-3/4" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
          {!isLoading && error && (
            <div className="p-2 text-xs text-destructive flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <AlertTriangle size={16} />
              <span className="group-data-[collapsible=icon]:hidden">{error}</span>
            </div>
          )}
          {!isLoading && !error && collections.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Database size={16} />
              <span className="group-data-[collapsible=icon]:hidden">No collections found.</span>
            </div>
          )}
          {!isLoading && !error && collections.length > 0 && (
            <SidebarMenu>
              {collections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectCollection(collection.name)}
                    isActive={selectedCollection === collection.name}
                    tooltip={{ children: collection.name, side: 'right', align: 'start', className: "ml-2"}}
                  >
                    <Database size={18} />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{collection.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
