import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PCProvider, usePCContext } from '../PCContext';

describe('PCContext - batchMove', () => {
  // Removed fake timers as they were causing timeouts with waitFor

  it('moves N items correctly when plenty are available', async () => {
    const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });

    // Wait for initial data
    await waitFor(() => expect(result.current.pcs.length).toBeGreaterThan(0));

    const initialImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const initialShipped = result.current.pcs.filter(p => p.status === 'Shipped');
    const countToMove = 5;

    // Ensure we have enough
    expect(initialImaging.length).toBeGreaterThan(countToMove);

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Shipped');
    });

    const finalImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const finalShipped = result.current.pcs.filter(p => p.status === 'Shipped');

    expect(finalImaging.length).toBe(initialImaging.length - countToMove);
    expect(finalShipped.length).toBe(initialShipped.length + countToMove);
  });

  it('moves all available items if count > available', async () => {
     const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });
    await waitFor(() => expect(result.current.pcs.length).toBeGreaterThan(0));

    const initialImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const countToMove = initialImaging.length + 10;

    act(() => {
      result.current.batchMove(countToMove, 'Imaging', 'Shipped');
    });

    const finalImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    expect(finalImaging.length).toBe(0);
  });

  it('does nothing if count is 0', async () => {
     const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });
    await waitFor(() => expect(result.current.pcs.length).toBeGreaterThan(0));

    const initialImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const initialShipped = result.current.pcs.filter(p => p.status === 'Shipped');

    act(() => {
      result.current.batchMove(0, 'Imaging', 'Shipped');
    });

    const finalImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const finalShipped = result.current.pcs.filter(p => p.status === 'Shipped');

    expect(finalImaging.length).toBe(initialImaging.length);
    expect(finalShipped.length).toBe(initialShipped.length);
  });

  it('handles negative count safely (boundary check)', async () => {
     const { result } = renderHook(() => usePCContext(), {
      wrapper: ({ children }) => <PCProvider>{children}</PCProvider>,
    });
    await waitFor(() => expect(result.current.pcs.length).toBeGreaterThan(0));

    const initialImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const initialShipped = result.current.pcs.filter(p => p.status === 'Shipped');

    act(() => {
      result.current.batchMove(-1, 'Imaging', 'Shipped');
    });

    const finalImaging = result.current.pcs.filter(p => p.status === 'Imaging');
    const finalShipped = result.current.pcs.filter(p => p.status === 'Shipped');

    // Expectation: Should NOT move anything.
    expect(finalImaging.length).toBe(initialImaging.length);
    expect(finalShipped.length).toBe(initialShipped.length);
  });
});
