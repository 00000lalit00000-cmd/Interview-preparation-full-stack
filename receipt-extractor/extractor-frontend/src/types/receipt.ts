/**
 * Receipt-related types
 */

export type ExtractionStatus = 'extracting' | 'extracted' | 'failed' | 'invalid';

export interface ReceiptItem {
  name: string;
  amount: number;
}

export interface ReceiptDetails {
  vendorName: string;
  date: string;
  currency: string;
  items: ReceiptItem[];
  tax: number;
  total: number;
}

export interface ReceiptSummary {
  id: string;
  originalName: string;
  status: ExtractionStatus;
  createdAt: string;
  imageUrl: string;
}

export interface ReceiptDetail extends ReceiptSummary {
  details?: ReceiptDetails;
  failureReason?: string | null;
}
