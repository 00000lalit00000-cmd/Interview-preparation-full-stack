import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserId } from './useUserId';

describe('useUserId', () => {
  const STORAGE_KEY = 'test-user-id';

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('should generate new userId if not in localStorage', () => {
    const { result } = renderHook(() => useUserId(STORAGE_KEY));
    
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should retrieve existing userId from localStorage', () => {
    const existingId = 'existing-uuid-123';
    window.localStorage.setItem(STORAGE_KEY, existingId);

    const { result } = renderHook(() => useUserId(STORAGE_KEY));
    
    expect(result.current).toBe(existingId);
  });

  it('should persist generated userId to localStorage', () => {
    const { result } = renderHook(() => useUserId(STORAGE_KEY));
    const userId = result.current;

    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    expect(storedValue).toBe(userId);
  });

  it('should return same userId on re-render', () => {
    const { result, rerender } = renderHook(() => useUserId(STORAGE_KEY));
    const initialId = result.current;

    rerender();
    
    expect(result.current).toBe(initialId);
  });

  it('should handle different storage keys', () => {
    const { result: result1 } = renderHook(() => useUserId('key1'));
    const { result: result2 } = renderHook(() => useUserId('key2'));

    expect(result1.current).not.toBe(result2.current);
    expect(window.localStorage.getItem('key1')).toBe(result1.current);
    expect(window.localStorage.getItem('key2')).toBe(result2.current);
  });

  it('should generate valid UUID format', () => {
    const { result } = renderHook(() => useUserId(STORAGE_KEY));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    expect(result.current).toMatch(uuidRegex);
  });
});
