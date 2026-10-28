import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { receiptClient } from './receipt';
import type { ReceiptSummary, ReceiptDetail } from '../types/receipt';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('ReceiptClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('listReceipts', () => {
    it('should fetch receipts for a user', async () => {
      const mockReceipts: ReceiptSummary[] = [
        {
          id: '123',
          originalName: 'receipt.jpg',
          status: 'extracted',
          createdAt: '2024-01-01T00:00:00Z',
          imageUrl: 'http://example.com/image.jpg',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipts: mockReceipts }),
      });

      const result = await receiptClient.listReceipts('user1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/receipts?userId=user1'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
      expect(result.receipts).toEqual(mockReceipts);
    });

    it('should encode userId in query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipts: [] }),
      });

      await receiptClient.listReceipts('user@test.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user%40test.com'),
        expect.any(Object),
      );
    });

    it('should throw error on HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(receiptClient.listReceipts('user1')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should timeout after configured duration', async () => {
      mockFetch.mockImplementationOnce(
        ({ signal }: { signal: AbortSignal }) => {
          return new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ receipts: [] }),
                }),
              10000,
            );
          });
        },
      );

      const promise = receiptClient.listReceipts('user1');
      vi.advanceTimersByTime(5100); // Default timeout is 5000ms, advance just past it

      await expect(promise).rejects.toThrow();
    }, 10000);
  });

  describe('getReceipt', () => {
    it('should fetch receipt details by id', async () => {
      const mockDetail: ReceiptDetail = {
        id: '123',
        originalName: 'receipt.jpg',
        status: 'extracted',
        createdAt: '2024-01-01T00:00:00Z',
        imageUrl: 'http://example.com/image.jpg',
        details: {
          vendorName: 'Test Store',
          date: '2024-01-01',
          currency: 'USD',
          items: [],
          tax: 10,
          total: 110,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: mockDetail }),
      });

      const result = await receiptClient.getReceipt('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/receipts/123'),
        expect.any(Object),
      );
      expect(result.receipt).toEqual(mockDetail);
    });
  });

  describe('uploadReceipt', () => {
    it('should upload receipt file with userId', async () => {
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockSummary: ReceiptSummary = {
        id: '123',
        originalName: 'receipt.jpg',
        status: 'extracting',
        createdAt: '2024-01-01T00:00:00Z',
        imageUrl: 'http://example.com/image.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: mockSummary }),
      });

      const result = await receiptClient.uploadReceipt('user1', file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/receipts'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      );

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('userId')).toBe('user1');
      expect(formData.get('file')).toBe(file);

      expect(result.receipt).toEqual(mockSummary);
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(receiptClient.uploadReceipt('user1', file)).rejects.toThrow();
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt with userId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await receiptClient.deleteReceipt('123', 'user1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/receipts/123?userId=user1'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should encode special characters in userId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await receiptClient.deleteReceipt('123', 'user@test.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user%40test.com'),
        expect.any(Object),
      );
    });
  });

  describe('getImageUrl', () => {
    it('should return correct image URL', () => {
      const url = receiptClient.getImageUrl('123');
      expect(url).toContain('/receipts/123/image');
    });

    it('should work with different receipt IDs', () => {
      const url1 = receiptClient.getImageUrl('abc');
      const url2 = receiptClient.getImageUrl('xyz');

      expect(url1).toContain('abc');
      expect(url2).toContain('xyz');
      expect(url1).not.toBe(url2);
    });
  });
});
