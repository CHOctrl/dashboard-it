import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PCProvider, usePCContext } from './PCContext';

// Mock Math.random to make tests deterministic
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.5);
global.Math = mockMath;

describe('PCContext batchMove', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.Math.random as jest.Mock).mockReturnValue(0.5);
  });

  it('moves specified number of PCs from one status to another', async () => {
    const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });

    // Wait for initial data population
    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    // With random=0.5, all initial PCs should be 'Imaging'
    // 0.5 <= 0.6 so 'Imaging' (logic in generateMockData: if > 0.8 Completed, else if > 0.6 Shipped, else Imaging)
    const initialImagingCount = result.current.pcs.filter(p => p.status === 'Imaging').length;
    const initialShippedCount = result.current.pcs.filter(p => p.status === 'Shipped').length;

    expect(initialImagingCount).toBeGreaterThan(0);
    expect(initialShippedCount).toBe(0);

    const countToMove = 5;

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Shipped');
    });

    const finalImagingCount = result.current.pcs.filter(p => p.status === 'Imaging').length;
    const finalShippedCount = result.current.pcs.filter(p => p.status === 'Shipped').length;

    expect(finalShippedCount).toBe(initialShippedCount + countToMove);
    expect(finalImagingCount).toBe(initialImagingCount - countToMove);
  });

  it('moves all available PCs if count exceeds available', async () => {
    const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    const initialImagingCount = result.current.pcs.filter(p => p.status === 'Imaging').length;
    const countToMove = initialImagingCount + 10; // Request more than available

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Completed');
    });

    const finalImagingCount = result.current.pcs.filter(p => p.status === 'Imaging').length;
    const finalCompletedCount = result.current.pcs.filter(p => p.status === 'Completed').length;

    expect(finalImagingCount).toBe(0);
    expect(finalCompletedCount).toBe(initialImagingCount);
  });

  it('does nothing if no PCs match fromStatus', async () => {
    const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });

    await waitFor(() => {
      expect(result.current.pcs.length).toBeGreaterThan(0);
    });

    // No 'Completed' initially (with random=0.5)
    const initialCompletedCount = result.current.pcs.filter(p => p.status === 'Completed').length;
    expect(initialCompletedCount).toBe(0);

    act(() => {
      result.current.batchMove(5, 'Completed', 'Shipped');
    });

    const finalShippedCount = result.current.pcs.filter(p => p.status === 'Shipped').length;
    expect(finalShippedCount).toBe(0);
  });
});
