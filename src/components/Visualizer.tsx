'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the P5 component with no SSR
const VisualizerContent = dynamic(() => import('./VisualizerContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-slate-400">
      Initializing Visualization...
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
    <div ref={containerRef} className="w-full h-[600px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
      <VisualizerContent width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default Visualizer;
