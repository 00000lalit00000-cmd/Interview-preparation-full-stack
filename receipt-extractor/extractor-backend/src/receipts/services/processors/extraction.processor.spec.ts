import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionProcessor } from './extraction.processor';
import { ReceiptsService } from '../receipts.service';
import { StorageService } from '../../../storage/storage.service';
import { AzureDocumentIntelligenceStrategy } from '../extraction-strategies/azure-document-intelligence.strategy';
import { Job } from 'bullmq';
import { ExtractionStatus } from '../../../database/entities/receipt-extraction.entity';

describe('ExtractionProcessor', () => {
  let processor: ExtractionProcessor;
  let receiptsService: jest.Mocked<ReceiptsService>;
  let storageService: jest.Mocked<StorageService>;
  let extractionStrategy: jest.Mocked<AzureDocumentIntelligenceStrategy>;

  beforeEach(async () => {
    receiptsService = {
      getReceiptForProcessing: jest.fn(),
      updateExtractionResult: jest.fn(),
    } as any;

    storageService = {
      getObjectBase64: jest.fn(),
    } as any;

    extractionStrategy = {
      extractFromImage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionProcessor,
        { provide: ReceiptsService, useValue: receiptsService },
        { provide: StorageService, useValue: storageService },
        {
          provide: AzureDocumentIntelligenceStrategy,
          useValue: extractionStrategy,
        },
      ],
    }).compile();

    processor = module.get<ExtractionProcessor>(ExtractionProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process successful extraction and update receipt', async () => {
      const mockJob = {
        data: { receiptId: 'receipt-123' },
      } as Job;

      const mockReceipt = {
        id: 'receipt-123',
        imageKey: 'receipts/user-1/image.jpg',
        status: ExtractionStatus.EXTRACTING,
      };

      const mockImageData = {
        base64: 'base64ImageData',
        contentType: 'image/jpeg',
      };

      const mockExtractionResult = {
        vendorName: 'Coffee Shop',
        date: '2024-11-30',
        currency: 'USD',
        items: [{ name: 'Latte', amount: 5.5 }],
        tax: 0.5,
        total: 6.0,
      };

      receiptsService.getReceiptForProcessing.mockResolvedValue(
        mockReceipt as any,
      );
      storageService.getObjectBase64.mockResolvedValue(mockImageData);
      extractionStrategy.extractFromImage.mockResolvedValue({
        status: 'extracted',
        details: mockExtractionResult,
      });

      await processor.process(mockJob);

      expect(receiptsService.getReceiptForProcessing).toHaveBeenCalledWith(
        'receipt-123',
      );
      expect(storageService.getObjectBase64).toHaveBeenCalledWith(
        'receipts/user-1/image.jpg',
      );
      expect(extractionStrategy.extractFromImage).toHaveBeenCalledWith(
        'base64ImageData',
      );
      expect(receiptsService.updateExtractionResult).toHaveBeenCalledWith(
        'receipt-123',
        {
          status: ExtractionStatus.EXTRACTED,
          details: mockExtractionResult,
          failureReason: null,
        },
      );
    });

    it('should handle invalid receipt and update with invalid status', async () => {
      const mockJob = {
        data: { receiptId: 'receipt-456' },
      } as Job;

      const mockReceipt = {
        id: 'receipt-456',
        imageKey: 'receipts/user-2/dog.jpg',
        status: ExtractionStatus.EXTRACTING,
      };

      const mockImageData = {
        base64: 'base64DogImage',
        contentType: 'image/jpeg',
      };

      receiptsService.getReceiptForProcessing.mockResolvedValue(
        mockReceipt as any,
      );
      storageService.getObjectBase64.mockResolvedValue(mockImageData);
      extractionStrategy.extractFromImage.mockResolvedValue({
        status: 'invalid',
        reason: 'The image does not appear to be a valid receipt.',
      });

      await processor.process(mockJob);

      expect(receiptsService.updateExtractionResult).toHaveBeenCalledWith(
        'receipt-456',
        {
          status: ExtractionStatus.INVALID,
          details: null,
          failureReason: 'The image does not appear to be a valid receipt.',
        },
      );
    });

    it('should handle extraction failure and update with failed status', async () => {
      const mockJob = {
        data: { receiptId: 'receipt-789' },
      } as Job;

      const mockReceipt = {
        id: 'receipt-789',
        imageKey: 'receipts/user-3/corrupted.jpg',
        status: ExtractionStatus.EXTRACTING,
      };

      const mockImageData = {
        base64: 'corruptedBase64',
        contentType: 'image/jpeg',
      };

      receiptsService.getReceiptForProcessing.mockResolvedValue(
        mockReceipt as any,
      );
      storageService.getObjectBase64.mockResolvedValue(mockImageData);
      extractionStrategy.extractFromImage.mockResolvedValue({
        status: 'failed',
        reason: 'Azure Document Intelligence service is unavailable.',
      });

      await processor.process(mockJob);

      expect(receiptsService.updateExtractionResult).toHaveBeenCalledWith(
        'receipt-789',
        {
          status: ExtractionStatus.FAILED,
          details: null,
          failureReason:
            'Azure Document Intelligence service is unavailable.',
        },
      );
    });

    it('should handle receipt with missing essential fields as invalid', async () => {
      const mockJob = {
        data: { receiptId: 'receipt-999' },
      } as Job;

      const mockReceipt = {
        id: 'receipt-999',
        imageKey: 'receipts/user-4/partial.jpg',
        status: ExtractionStatus.EXTRACTING,
      };

      const mockImageData = {
        base64: 'partialReceiptData',
        contentType: 'image/jpeg',
      };

      receiptsService.getReceiptForProcessing.mockResolvedValue(
        mockReceipt as any,
      );
      storageService.getObjectBase64.mockResolvedValue(mockImageData);
      extractionStrategy.extractFromImage.mockResolvedValue({
        status: 'invalid',
        reason:
          'The image does not contain a valid receipt. Essential information such as vendor name, date, or total amount could not be extracted.',
      });

      await processor.process(mockJob);

      expect(receiptsService.updateExtractionResult).toHaveBeenCalledWith(
        'receipt-999',
        {
          status: ExtractionStatus.INVALID,
          details: null,
          failureReason:
            'The image does not contain a valid receipt. Essential information such as vendor name, date, or total amount could not be extracted.',
        },
      );
    });
  });
});
