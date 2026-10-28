import { API_BASE_URL, API_ENDPOINTS, REQUEST_TIMEOUT } from '../constants/config';
import type { ReceiptSummary, ReceiptDetail } from '../types/receipt';

/**
 * API client for receipt operations
 */

class ReceiptClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = REQUEST_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 204 No Content has no body
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listReceipts(userId: string): Promise<{ receipts: ReceiptSummary[] }> {
    return this.request<{ receipts: ReceiptSummary[] }>(
      `${API_ENDPOINTS.RECEIPTS}?userId=${encodeURIComponent(userId)}`,
    );
  }

  async getReceipt(id: string): Promise<{ receipt: ReceiptDetail }> {
    return this.request<{ receipt: ReceiptDetail }>(
      API_ENDPOINTS.RECEIPT_DETAIL(id),
    );
  }

  async uploadReceipt(userId: string, file: File): Promise<{ receipt: ReceiptSummary }> {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);

    return this.request<{ receipt: ReceiptSummary }>(
      API_ENDPOINTS.RECEIPTS,
      {
        method: 'POST',
        body: formData,
      },
    );
  }

  async deleteReceipt(id: string, userId: string): Promise<void> {
    await this.request<void>(
      `${API_ENDPOINTS.RECEIPT_DETAIL(id)}?userId=${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      },
    );
  }

  getEventsUrl(userId: string): string {
    return `${this.baseUrl}${API_ENDPOINTS.RECEIPT_EVENTS}?userId=${encodeURIComponent(userId)}`;
  }

  getImageUrl(id: string): string {
    return `${this.baseUrl}${API_ENDPOINTS.RECEIPT_IMAGE(id)}`;
  }
}

export const receiptClient = new ReceiptClient();
