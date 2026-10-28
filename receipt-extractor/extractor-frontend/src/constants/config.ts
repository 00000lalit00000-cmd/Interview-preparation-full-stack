/**
 * Application configuration
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const API_ENDPOINTS = {
  RECEIPTS: '/receipts',
  RECEIPT_EVENTS: '/receipts/events',
  RECEIPT_DETAIL: (id: string) => `/receipts/${id}`,
  RECEIPT_IMAGE: (id: string) => `/receipts/${id}/image`,
} as const;

export const STORAGE_KEYS = {
  USER_ID: 'receipt-extractor-user-id',
} as const;

export const REQUEST_TIMEOUT = 30000; // 30 seconds
