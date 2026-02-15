'use client';

import React, { useState, useEffect } from 'react';
import { usePCContext } from '../context/PCContext';
import { Play, Pause, RefreshCw, Zap } from 'lucide-react';

const Controls = () => {
  const { batchMove, resetData } = usePCContext();
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        // Move some items from Imaging to Shipped
        batchMove(Math.floor(Math.random() * 3) + 1, 'Imaging', 'Shipped');
        // Move some items from Shipped to Completed
        batchMove(Math.floor(Math.random() * 3) + 1, 'Shipped', 'Completed');
      }, 1000); // Every second
    }
    return () => clearInterval(interval);
  }, [isPlaying, batchMove]);

  const handleSimulateOnce = () => {
    batchMove(5, 'Imaging', 'Shipped');
    batchMove(5, 'Shipped', 'Completed');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-700 p-4 flex justify-center gap-4 z-50">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
          isPlaying
            ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-900'
        }`}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        {isPlaying ? 'Pause Simulation' : 'Auto Play'}
      </button>

      <button
        onClick={handleSimulateOnce}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold transition-all"
      >
        <Zap size={20} />
        <span className="hidden sm:inline">Step Forward</span>
      </button>

      <button
        onClick={resetData}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 font-bold border border-slate-700 transition-all"
      >
        <RefreshCw size={20} />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
};

export default Controls;
