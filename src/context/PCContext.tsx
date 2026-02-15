'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PC, Status, Branch } from '../types/pc';

interface PCContextType {
  pcs: PC[];
  movePC: (id: string, newStatus: Status) => void;
  batchMove: (count: number, fromStatus: Status, toStatus: Status) => void;
  resetData: () => void;
  getStats: () => { name: string; Imaging: number; Shipped: number; Completed: number }[];
}

const PCContext = createContext<PCContextType | undefined>(undefined);

const BRANCHES: Branch[] = ['HQ', 'Sales', 'Engineering', 'HR', 'Warehouse'];

const generateSerial = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 8; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
};

const generateMockData = (count: number = 200): PC[] => {
  const data: PC[] = [];
  for (let i = 0; i < count; i++) {
    let status: Status = 'Imaging';
    const r = Math.random();
    if (r > 0.8) status = 'Completed';
    else if (r > 0.6) status = 'Shipped';

    data.push({
      id: `pc-${i}`,
      serial: generateSerial(),
      branch: BRANCHES[Math.floor(Math.random() * BRANCHES.length)],
      status: status,
    });
  }
  return data;
};

export const PCProvider = ({ children }: { children: ReactNode }) => {
  const [pcs, setPcs] = useState<PC[]>([]);

  // Initialize data on client side only
  useEffect(() => {
    // eslint-disable-next-line
    setPcs(generateMockData());
  }, []);

  const movePC = useCallback((id: string, newStatus: Status) => {
    setPcs(prev => prev.map(pc => pc.id === id ? { ...pc, status: newStatus } : pc));
  }, []);

  const batchMove = useCallback((count: number, fromStatus: Status, toStatus: Status) => {
    setPcs(prev => {
      // Find candidates with matching status
      const candidates = prev.filter(p => p.status === fromStatus);
      if (candidates.length === 0) return prev;

      // Shuffle candidates
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());

      // Select 'count' items (or fewer if not enough)
      const toMove = shuffled.slice(0, Math.min(Math.max(0, count), shuffled.length)).map(p => p.id);

      return prev.map(pc => toMove.includes(pc.id) ? { ...pc, status: toStatus } : pc);
    });
  }, []);

  const resetData = useCallback(() => {
    setPcs(generateMockData());
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
