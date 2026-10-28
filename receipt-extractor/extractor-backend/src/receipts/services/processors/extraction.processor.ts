import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ExtractionStatus } from '../../../database/entities/receipt-extraction.entity';
import { ReceiptsService } from '../receipts.service';
import { EnqueueExtractionJobPayload } from '../../interfaces/extraction.interface';
import { StorageService } from '../../../storage/storage.service';
import { AzureDocumentIntelligenceStrategy } from '../extraction-strategies/azure-document-intelligence.strategy';

@Processor('receipt-extraction')
export class ExtractionProcessor extends WorkerHost {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly storageService: StorageService,
    private readonly extractionStrategy: AzureDocumentIntelligenceStrategy,
  ) {
    super();
  }

  async process(job: Job<EnqueueExtractionJobPayload>): Promise<void> {
    const { receiptId } = job.data;

    const receipt =
      await this.receiptsService.getReceiptForProcessing(receiptId);
    const image = await this.storageService.getObjectBase64(receipt.imageKey);
    const outcome = await this.extractionStrategy.extractFromImage(
      image.base64,
    );

    if (outcome.status === 'extracted') {
      await this.receiptsService.updateExtractionResult(receiptId, {
        status: ExtractionStatus.EXTRACTED,
        details: outcome.details,
        failureReason: null,
      });
    } else if (outcome.status === 'invalid') {
      await this.receiptsService.updateExtractionResult(receiptId, {
        status: ExtractionStatus.INVALID,
        details: null,
        failureReason: outcome.reason,
      });
    } else {
      await this.receiptsService.updateExtractionResult(receiptId, {
        status: ExtractionStatus.FAILED,
        details: null,
        failureReason: outcome.reason,
      });
    }
  }
}
