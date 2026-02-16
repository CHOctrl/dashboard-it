'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PC, Status, Branch } from '../types/pc';

interface PCContextType {
  pcs: PC[];
  movePC: (id: string, newStatus: Status, newBranch?: Branch) => void;
  batchMove: (count: number, fromStatus: Status, toStatus: Status) => void;
  resetData: () => void;
  getStats: () => { name: string; Imaging: number; Shipped: number; Completed: number }[];
}

const PCContext = createContext<PCContextType | undefined>(undefined);

const BRANCHES: Branch[] = ['HQ', 'Sales', 'Engineering', 'HR', 'Warehouse'];

export const PCProvider = ({ children }: { children: ReactNode }) => {
  const [pcs, setPcs] = useState<PC[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the server
    const socket = io();
    socketRef.current = socket;

    socket.on('initialState', (data: PC[]) => {
      setPcs(data);
    });

    socket.on('update', (data: PC[]) => {
      setPcs(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const movePC = useCallback((id: string, newStatus: Status, newBranch?: Branch) => {
    socketRef.current?.emit('move', { id, newStatus, newBranch });
  }, []);

  const batchMove = useCallback((count: number, fromStatus: Status, toStatus: Status) => {
    socketRef.current?.emit('batchMove', { count, fromStatus, toStatus });
  }, []);

  const resetData = useCallback(() => {
    socketRef.current?.emit('reset');
  }, []);

  const getStats = useCallback(() => {
    const statsMap: Record<string, { Imaging: number; Shipped: number; Completed: number }> = {};

    BRANCHES.forEach(b => {
      statsMap[b] = { Imaging: 0, Shipped: 0, Completed: 0 };
    });

    pcs.forEach(pc => {
      if (statsMap[pc.branch]) {
        statsMap[pc.branch][pc.status]++;
      }
    });

    return Object.entries(statsMap).map(([branch, counts]) => ({
      name: branch,
      ...counts
    }));
  }, [pcs]);

  return (
    <PCContext.Provider value={{ pcs, movePC, batchMove, resetData, getStats }}>
      {children}
    </PCContext.Provider>
  );
};

export const usePCContext = () => {
  const context = useContext(PCContext);
  if (context === undefined) {
    throw new Error('usePCContext must be used within a PCProvider');
  }
  return context;
};
