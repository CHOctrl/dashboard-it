'use client';

import React from 'react';
import { PCProvider } from '../context/PCContext';
import DashboardStats from '../components/DashboardStats';
import Visualizer from '../components/Visualizer';
import Controls from '../components/Controls';
import { Server, Monitor, Truck } from 'lucide-react';

export default function Home() {
  return (
    <PCProvider>
      <div className="min-h-screen bg-slate-100 text-slate-700 flex flex-col font-sans pb-24">
        {/* Header */}
        <header className="p-4 sm:p-6 border-b border-slate-300 bg-white/50 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Monitor className="text-slate-600" />
              DEPLOYMENT OPS
            </h1>
            <div className="text-sm text-slate-500 hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1"><Server size={14} /> IMAGING</div>
              <div className="flex items-center gap-1"><Truck size={14} /> SHIPPING</div>
              <div className="flex items-center gap-1"><Monitor size={14} /> ONLINE</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          {/* Stats Section */}
          <section>
            <DashboardStats />
          </section>

          {/* Visualization Section */}
          <section className="flex-grow flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-semibold text-slate-600">Live Tracker</h2>
              <div className="text-xs text-slate-400 font-mono">
                DATA SYNC: REALTIME
              </div>
            </div>

            {/* Visualizer Container */}
            <div className="w-full relative">
              <Visualizer />
            </div>
          </section>
        </main>

        {/* Controls */}
        <Controls />
      </div>
    </PCProvider>
  );
}
