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
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 flex justify-center gap-4 z-50">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm ${
          isPlaying
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        {isPlaying ? 'Pause Simulation' : 'Auto Play'}
      </button>

      <button
        onClick={handleSimulateOnce}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all border border-slate-200"
      >
        <Zap size={20} />
        <span className="hidden sm:inline">Step Forward</span>
      </button>

      <button
        onClick={resetData}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold border border-slate-200 transition-all shadow-sm"
      >
        <RefreshCw size={20} />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
};

export default Controls;
