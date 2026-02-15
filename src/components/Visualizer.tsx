'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';

const VisualizerContent = dynamic(() => import('./VisualizerContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-900 text-slate-400">
      Loading Visualization...
    </div>
  ),
});

const Visualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 600, // Fallback height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl relative">
      <div className="absolute top-2 right-2 z-10 text-xs text-slate-500 font-mono">
        CANVAS: {dimensions.width}x{dimensions.height}
      </div>
      <VisualizerContent width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default Visualizer;
