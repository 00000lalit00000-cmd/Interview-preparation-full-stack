import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatStatusLabel,
} from './formatters';

describe('formatDateTime', () => {
  it('should format ISO date string to readable format', () => {
    const isoString = '2024-01-15T14:30:00.000Z';
    const result = formatDateTime(isoString);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should return original string if date parsing fails', () => {
    const invalidDate = 'invalid-date';
    const result = formatDateTime(invalidDate);
    expect(result).toBe(invalidDate);
  });

  it('should handle empty string', () => {
    const result = formatDateTime('');
    expect(result).toBe('');
  });
});

describe('formatStatusLabel', () => {
  it('should format extracting status', () => {
    expect(formatStatusLabel('extracting')).toBe('Extracting...');
  });

  it('should format extracted status', () => {
    expect(formatStatusLabel('extracted')).toBe('Done');
  });

  it('should format failed status', () => {
    expect(formatStatusLabel('failed')).toBe('Failed');
  });

  it('should format invalid status', () => {
    expect(formatStatusLabel('invalid')).toBe('Invalid');
  });

  it('should return original status for unknown values', () => {
    expect(formatStatusLabel('pending')).toBe('pending');
  });
});


