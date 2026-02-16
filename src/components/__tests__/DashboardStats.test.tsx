import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStats from '../DashboardStats';
import { PC } from '../../types/pc';

// Hoist the mock function so it can be used in vi.mock
const { mockGetPcs } = vi.hoisted(() => {
  return { mockGetPcs: vi.fn() };
});

vi.mock('../../context/PCContext', () => ({
  usePCContext: () => ({
    pcs: mockGetPcs(),
  }),
}));

interface ChartData {
  name: string;
  Imaging: number;
  Shipped: number;
  Completed: number;
}

// Mock Recharts components to avoid rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ data }: { data: ChartData[] }) => <div data-testid="bar-chart" data-chart={JSON.stringify(data)} />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe('DashboardStats', () => {
  beforeEach(() => {
    mockGetPcs.mockReturnValue([]);
  });

  it('renders correctly with empty data', () => {
    mockGetPcs.mockReturnValue([]);
    render(<DashboardStats />);

    expect(screen.getByText('Imaging: 0')).toBeInTheDocument();
    expect(screen.getByText('Shipped: 0')).toBeInTheDocument();
    expect(screen.getByText('Completed: 0')).toBeInTheDocument();
  });

  it('calculates totals correctly from context data', () => {
    const testData: PC[] = [
      { id: '1', serial: 'S1', status: 'Imaging', branch: 'HQ' },
      { id: '2', serial: 'S2', status: 'Imaging', branch: 'Sales' },
      { id: '3', serial: 'S3', status: 'Shipped', branch: 'HQ' },
      { id: '4', serial: 'S4', status: 'Completed', branch: 'Engineering' },
    ];
    mockGetPcs.mockReturnValue(testData);

    render(<DashboardStats />);

    expect(screen.getByText('Imaging: 2')).toBeInTheDocument();
    expect(screen.getByText('Shipped: 1')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();
  });

  it('aggregates chart data correctly by branch', () => {
    const testData: PC[] = [
      { id: '1', serial: 'S1', status: 'Imaging', branch: 'HQ' },
      { id: '2', serial: 'S2', status: 'Completed', branch: 'HQ' },
      { id: '3', serial: 'S3', status: 'Shipped', branch: 'Sales' },
      { id: '4', serial: 'S4', status: 'Imaging', branch: 'Engineering' },
    ];
    mockGetPcs.mockReturnValue(testData);

    render(<DashboardStats />);

    const chart = screen.getByTestId('bar-chart');
    const data: ChartData[] = JSON.parse(chart.getAttribute('data-chart') || '[]');

    // Check HQ stats
    const hq = data.find((d) => d.name === 'HQ');
    expect(hq).toEqual(expect.objectContaining({
      name: 'HQ',
      Imaging: 1,
      Shipped: 0,
      Completed: 1
    }));

    // Check Sales stats
    const sales = data.find((d) => d.name === 'Sales');
    expect(sales).toEqual(expect.objectContaining({
      name: 'Sales',
      Imaging: 0,
      Shipped: 1,
      Completed: 0
    }));

    // Check Engineering stats
    const engineering = data.find((d) => d.name === 'Engineering');
    expect(engineering).toEqual(expect.objectContaining({
      name: 'Engineering',
      Imaging: 1,
      Shipped: 0,
      Completed: 0
    }));
  });
});
