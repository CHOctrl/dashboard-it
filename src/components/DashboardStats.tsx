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
  const { pcs } = usePCContext();

  // Aggregate stats from the context
  const data = useMemo(() => {
    const statsMap: Record<string, { Imaging: number; Shipped: number; Completed: number }> = {};
    const branches = ['HQ', 'Sales', 'Engineering', 'HR', 'Warehouse'];

    branches.forEach(b => {
      statsMap[b] = { Imaging: 0, Shipped: 0, Completed: 0 };
    });

    pcs.forEach(pc => {
      if (statsMap[pc.branch]) {
        statsMap[pc.branch][pc.status]++;
      }
    });

    return Object.entries(statsMap).map(([name, counts]) => ({
      name,
      ...counts,
    }));
  }, [pcs]);

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
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-500 animate-pulse"></span>
          Deployment Status
        </h2>
        <div className="flex text-sm font-medium">
          <div className="text-slate-600 font-bold mr-6">Imaging: {totals.Imaging}</div>
          <div className="text-slate-500 font-bold mr-6">Shipped: {totals.Shipped}</div>
          <div className="text-slate-700 font-bold">Completed: {totals.Completed}</div>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#334155' }}
              itemStyle={{ color: '#334155' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ color: '#475569' }} />
            <Bar dataKey="Imaging" stackId="a" fill="#475569" name="Imaging" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Shipped" stackId="a" fill="#64748b" name="Shipped" />
            <Bar dataKey="Completed" stackId="a" fill="#334155" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardStats;
