'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyCarbon } from '@/types';

interface CarbonTrendLineProps {
  data: DailyCarbon[];
}

export function CarbonTrendLine({ data }: CarbonTrendLineProps) {
  if (!data || data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-600 text-xs">
        Need at least 2 days of data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    total: Math.round(d.total * 100) / 100,
  }));

  return (
    <div role="img" aria-label="Total carbon trend over time">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value} kg CO₂e`, 'Total']}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5, fill: '#22c55e', stroke: '#0a0e1a', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
