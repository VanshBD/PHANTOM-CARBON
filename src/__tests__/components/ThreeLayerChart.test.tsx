import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { ThreeLayerChart } from '@/components/dashboard/ThreeLayerChart';
import type { DailyCarbon } from '@/types';

// Mock recharts to avoid SVG rendering issues in jsdom
jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => null,
}));

const mockData: DailyCarbon[] = [
  { date: '2025-06-12', surface: 3.5, shadow: 2.1, ghost: 0.8, total: 6.4 },
  { date: '2025-06-13', surface: 2.1, shadow: 1.5, ghost: 0.5, total: 4.1 },
  { date: '2025-06-14', surface: 4.2, shadow: 3.0, ghost: 1.2, total: 8.4 },
];

describe('ThreeLayerChart', () => {
  it('renders the area chart when data is provided', () => {
    render(<ThreeLayerChart data={mockData} period="7d" />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('shows empty state when no data provided', () => {
    render(<ThreeLayerChart data={[]} period="7d" />);
    expect(screen.getByText(/No data for this period/i)).toBeInTheDocument();
  });

  it('has accessible role and aria-label', () => {
    render(<ThreeLayerChart data={mockData} period="7d" />);
    const chart = screen.getByRole('img');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('aria-label');
  });

  it('shows helper text in empty state', () => {
    render(<ThreeLayerChart data={[]} period="7d" />);
    expect(screen.getByText(/Start chatting or uploading/i)).toBeInTheDocument();
  });
});
