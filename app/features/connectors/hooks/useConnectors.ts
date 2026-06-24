'use client';
import { useState, useCallback } from 'react';
import type { Connector } from '@/app/features/types';
import { uid } from '../utils';

/** Manages the connector collection and its CRUD operations. Mirrors the shape of useBlocks. */
export function useConnectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);

  /** Adds a directed connector between two blocks, skipping exact duplicates. */
  const addConnector = useCallback((sourceId: string, targetId: string) => {
    setConnectors(prev =>
      prev.some(c => c.sourceId === sourceId && c.targetId === targetId)
        ? prev
        : [...prev, { id: uid(), sourceId, targetId }],
    );
  }, []);

  /** Removes a connector by id. */
  const deleteConnector = useCallback((id: string) => {
    setConnectors(prev => prev.filter(c => c.id !== id));
  }, []);

  /** Removes every connector touching one of the given block ids. */
  const pruneByBlocks = useCallback((removed: Set<string>) => {
    setConnectors(prev => prev.filter(c => !removed.has(c.sourceId) && !removed.has(c.targetId)));
  }, []);

  return { connectors, setConnectors, addConnector, deleteConnector, pruneByBlocks };
}
