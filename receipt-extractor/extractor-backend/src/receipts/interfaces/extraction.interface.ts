import { ReceiptExtractionResultDto } from '../dto/receipt-extraction-result.dto';

export interface EnqueueExtractionJobPayload {
  receiptId: string;
}

export type ExtractionOutcome =
  | { status: 'extracted'; details: ReceiptExtractionResultDto }
  | { status: 'invalid'; reason: string }
  | { status: 'failed'; reason: string };

export interface IExtractionStrategy {
  extractFromImage(
    imageBase64: string,
    _contentType?: string,
  ): Promise<ExtractionOutcome>;
}
