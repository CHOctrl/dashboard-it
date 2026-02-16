import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PCProvider, usePCContext } from './PCContext';

// Mock Math.random to ensure deterministic behavior
// 0.5 means:
// generateMockData: status will be 'Imaging' (0.5 <= 0.6)
// batchMove: sort compare function will be 0 (stable sort/no change)
const MOCK_RANDOM_VALUE = 0.5;

describe('PCContext', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(MOCK_RANDOM_VALUE);
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PCProvider>{children}</PCProvider>
  );

  test('initializes with generated data', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    // Wait for useEffect to populate data
    await waitFor(() => {
      expect(result.current.pcs.length).toBe(200);
    });

    // With random=0.5, all statuses should be 'Imaging'
    const allImaging = result.current.pcs.every(pc => pc.status === 'Imaging');
    expect(allImaging).toBe(true);
  });

  test('movePC updates the status of a specific PC', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    const targetPC = result.current.pcs[0];
    const newStatus = 'Shipped';

    act(() => {
      result.current.movePC(targetPC.id, newStatus);
    });

    const updatedPC = result.current.pcs.find(p => p.id === targetPC.id);
    expect(updatedPC?.status).toBe(newStatus);

    // Verify other PCs are unchanged
    const otherPC = result.current.pcs[1];
    expect(otherPC.status).toBe('Imaging');
  });

  test('batchMove moves a specific number of PCs', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    // Initially all are 'Imaging'
    const countToMove = 10;

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Shipped');
    });

    const shippedCount = result.current.pcs.filter(p => p.status === 'Shipped').length;
    const imagingCount = result.current.pcs.filter(p => p.status === 'Imaging').length;

    expect(shippedCount).toBe(countToMove);
    expect(imagingCount).toBe(200 - countToMove);
  });

  test('batchMove handles moving more than available', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    const countToMove = 300; // More than 200 available

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Shipped');
    });

    const shippedCount = result.current.pcs.filter(p => p.status === 'Shipped').length;
    expect(shippedCount).toBe(200); // All should be moved
  });

  test('resetData regenerates the data', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    // Change some state
    act(() => {
      result.current.movePC(result.current.pcs[0].id, 'Completed');
    });

    expect(result.current.pcs[0].status).toBe('Completed');

    // Reset
    act(() => {
      result.current.resetData();
    });

    // With fixed random seed, it generates the same data, but status should be back to 'Imaging'
    // because generateMockData creates new objects.
    expect(result.current.pcs[0].status).toBe('Imaging');
    expect(result.current.pcs).toHaveLength(200);
  });

  test('getStats calculates correct counts', async () => {
    const { result } = renderHook(() => usePCContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    // Initial state: all Imaging (due to mock random = 0.5)
    let stats = result.current.getStats();

    // Sum up totals across branches
    const totalImaging = stats.reduce((sum, branch) => sum + branch.Imaging, 0);
    const totalShipped = stats.reduce((sum, branch) => sum + branch.Shipped, 0);

    expect(totalImaging).toBe(200);
    expect(totalShipped).toBe(0);

    // Move some PCs
    act(() => {
      result.current.batchMove(50, 'Imaging', 'Shipped');
    });

    stats = result.current.getStats();
    const newTotalImaging = stats.reduce((sum, branch) => sum + branch.Imaging, 0);
    const newTotalShipped = stats.reduce((sum, branch) => sum + branch.Shipped, 0);

    expect(newTotalImaging).toBe(150);
    expect(newTotalShipped).toBe(50);
  });
});
