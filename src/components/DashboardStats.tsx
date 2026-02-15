'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePCContext } from '../context/PCContext';

const DashboardStats = () => {
  const { pcs, getStats } = usePCContext();

  // Aggregate stats from the context
  const data = useMemo(() => getStats(), [getStats]);

  // Calculate totals for a summary
  const totals = useMemo(() => {
    return pcs.reduce(
      (acc, pc) => {
        acc[pc.status]++;
        return acc;
      },
      { Imaging: 0, Shipped: 0, Completed: 0 }
    );
  }, [pcs]);

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
          Deployment Status
        </h2>
        <div className="flex text-sm font-medium">
          <div className="text-cyan-400 font-bold mr-6">Imaging: {totals.Imaging}</div>
          <div className="text-amber-400 font-bold mr-6">Shipped: {totals.Shipped}</div>
          <div className="text-emerald-400 font-bold">Completed: {totals.Completed}</div>
        </div>
      </div>

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Bar dataKey="Imaging" stackId="a" fill="#06b6d4" name="Imaging" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Shipped" stackId="a" fill="#f59e0b" name="Shipped" />
            <Bar dataKey="Completed" stackId="a" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardStats;
