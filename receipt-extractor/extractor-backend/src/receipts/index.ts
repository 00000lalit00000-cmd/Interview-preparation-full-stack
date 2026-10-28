// Public API exports
export * from './receipts.controller';
export * from './receipts.module';
export * from './services/receipts.service';
export * from './services/receipt-events.service';

// DTOs for API contracts
export { SubmitReceiptDto } from './dto/submit-receipt.dto';
export { ReceiptSummaryDto } from './dto/receipt-summary.dto';
export { ReceiptDetailDto } from './dto/receipt-detail.dto';
export { ReceiptExtractionResultDto } from './dto/receipt-extraction-result.dto';
export { ReceiptItemDto } from './dto/receipt-item.dto';

// Interfaces for type contracts
export type {
  EnqueueExtractionJobPayload,
  ExtractionOutcome,
  IExtractionStrategy,
} from './interfaces/extraction.interface';
