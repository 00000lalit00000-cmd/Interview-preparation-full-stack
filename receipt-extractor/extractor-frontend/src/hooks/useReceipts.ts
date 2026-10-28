import { useState, useCallback, useEffect } from 'react';
import { receiptClient } from '../api/receipt';
import type { ReceiptSummary, ReceiptDetail } from '../types/receipt';

/**
 * Hook for managing receipts data and operations
 */
export function useReceipts(userId: string) {
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReceipts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await receiptClient.listReceipts(userId);
      setReceipts(data.receipts);
      return data.receipts;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [] as ReceiptSummary[];
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [userId]);

  const uploadReceipt = useCallback(
    async (file: File) => {
      try {
        const data = await receiptClient.uploadReceipt(userId, file);
        // Add new receipt to the list
        setReceipts((prev) => [data.receipt, ...prev]);
        return data.receipt;
      } catch (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    [userId],
  );

  const deleteReceipt = useCallback(
    async (id: string) => {
      try {
        await receiptClient.deleteReceipt(id, userId);
        // Remove receipt from list
        setReceipts((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return {
    receipts,
    loading,
    error,
    fetchReceipts,
    uploadReceipt,
    deleteReceipt,
  };
}

/**
 * Hook for fetching receipt details
 */
export function useReceiptDetail(id: string) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receiptClient.getReceipt(id);
      setReceipt(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { receipt, loading, error, refetch: fetchDetail };
}
