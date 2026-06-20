'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyCarbon } from '@/types';

interface ThreeLayerChartProps {
  data: DailyCarbon[];
  period: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);

  return (
    <div
      className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl text-sm"
      role="tooltip"
    >
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6 mb-1">
          <span className="flex items-center gap-1.5 text-gray-400 capitalize">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
            {p.name}
          </span>
          <span className="font-semibold text-white">{p.value.toFixed(2)} kg</span>
        </div>
      ))}
      <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
        <span className="text-gray-500">Total</span>
        <span className="font-bold text-white">{total.toFixed(2)} kg</span>
      </div>
    </div>
  );
}

export function ThreeLayerChart({ data, period }: ThreeLayerChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center text-gray-600 text-sm"
        role="img"
        aria-label="Carbon trend chart — no data available"
      >
        <div className="text-center">
          <div className="text-3xl mb-2" aria-hidden="true">📊</div>
          <p>No data for this period yet.</p>
          <p className="text-xs mt-1 text-gray-700">Start chatting or uploading receipts to see trends.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    Surface: Math.round(d.surface * 100) / 100,
    Shadow: Math.round(d.shadow * 100) / 100,
    Ghost: Math.round(d.ghost * 100) / 100,
  }));

  return (
    <div
      role="img"
      aria-label={`Carbon footprint trend chart for past ${period} showing surface, shadow, and ghost emissions by day`}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="surfaceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}kg`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-gray-400 text-xs capitalize">{value}</span>
            )}
          />

          <Area
            type="monotone"
            dataKey="Surface"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#surfaceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#22c55e', stroke: '#0a0e1a', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="Shadow"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#shadowGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', stroke: '#0a0e1a', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="Ghost"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#ghostGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316', stroke: '#0a0e1a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
