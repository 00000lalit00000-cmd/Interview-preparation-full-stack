import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './services/receipts.service';
import { ReceiptEventsService } from './services/receipt-events.service';
import { ExtractionProcessor } from './services/processors/extraction.processor';
import { ReceiptExtraction } from '../database/entities/receipt-extraction.entity';
import { StorageModule } from '../storage/storage.module';
import { AzureDocumentIntelligenceStrategy } from './services/extraction-strategies/azure-document-intelligence.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceiptExtraction]),
    BullModule.registerQueue({
      name: 'receipt-extraction',
    }),
    StorageModule,
  ],
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    ReceiptEventsService,
    AzureDocumentIntelligenceStrategy,
    ExtractionProcessor,
  ],
  exports: [ReceiptsService, ReceiptEventsService],
})
export class ReceiptsModule {}
