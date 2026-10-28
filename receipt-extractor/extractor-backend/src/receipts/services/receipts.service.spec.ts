import { Repository } from 'typeorm';
import { ExtractionStatus } from '../../database/entities/receipt-extraction.entity';
import { Queue } from 'bullmq';
import { StorageService } from '../../storage/storage.service';
import { ReceiptsService } from './receipts.service';
import { ReceiptExtraction } from '../../database/entities/receipt-extraction.entity';
import { NotFoundException } from '@nestjs/common';
import { ReceiptEventsService } from './receipt-events.service';

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let repository: jest.Mocked<Repository<ReceiptExtraction>>;
  let storage: jest.Mocked<StorageService>;
  let queue: jest.Mocked<Queue>;
  let receiptEvents: jest.Mocked<ReceiptEventsService>;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    } as any;

    storage = {
      deleteObject: jest.fn(),
      getObjectStream: jest.fn(),
      uploadObject: jest.fn(),
      getObjectBase64: jest.fn(),
    } as any;

    queue = {
      add: jest.fn(),
    } as any;

    receiptEvents = {
      emit: jest.fn(),
      subscribe: jest.fn(),
    } as any;

    service = new ReceiptsService(repository, storage, queue, receiptEvents);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReceipt', () => {
    it('should create receipt, upload to storage, and queue extraction job', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'receipt.jpg',
        buffer: Buffer.from('mock-image'),
        mimetype: 'image/jpeg',
      } as any;

      const mockReceipt = {
        id: 'receipt-123',
        userId: 'user-1',
        originalName: 'receipt.jpg',
        imageKey: expect.stringContaining('receipts/user-1/'),
        status: ExtractionStatus.EXTRACTING,
        createdAt: new Date(),
      } as ReceiptExtraction;

      repository.create.mockReturnValue(mockReceipt);
      repository.save.mockResolvedValue(mockReceipt);
      storage.uploadObject.mockResolvedValue(undefined);
      queue.add.mockResolvedValue({} as any);

      const result = await service.createReceipt('user-1', mockFile);

      expect(storage.uploadObject).toHaveBeenCalledWith(
        expect.stringContaining('receipts/user-1/'),
        mockFile.buffer,
        'image/jpeg',
      );
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith('extract', {
        receiptId: 'receipt-123',
      });
      expect(result).toMatchObject({
        id: 'receipt-123',
        originalName: 'receipt.jpg',
        status: ExtractionStatus.EXTRACTING,
      });
    });

    it('should throw error when file is not provided', async () => {
      await expect(service.createReceipt('user-1', undefined)).rejects.toThrow(
        'File is required',
      );
      expect(storage.uploadObject).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('listReceipts', () => {
    it('should return list of receipts for user ordered by creation date', async () => {
      const mockReceipts = [
        {
          id: 'receipt-2',
          userId: 'user-1',
          originalName: 'receipt2.jpg',
          status: ExtractionStatus.EXTRACTED,
          createdAt: new Date('2024-12-01'),
        },
        {
          id: 'receipt-1',
          userId: 'user-1',
          originalName: 'receipt1.jpg',
          status: ExtractionStatus.EXTRACTING,
          createdAt: new Date('2024-11-30'),
        },
      ] as ReceiptExtraction[];

      repository.find.mockResolvedValue(mockReceipts);

      const result = await service.listReceipts('user-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('receipt-2');
    });
  });

  describe('getReceipt', () => {
    it('should return receipt details', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        userId: 'user-1',
        originalName: 'receipt.jpg',
        status: ExtractionStatus.EXTRACTED,
        vendorName: 'Coffee Shop',
        date: '2024-11-30',
        currency: 'USD',
        items: [{ name: 'Latte', amount: 5.5 }],
        tax: 0.5,
        total: 6.0,
        createdAt: new Date(),
      } as ReceiptExtraction;

      repository.findOne.mockResolvedValue(mockReceipt);

      const result = await service.getReceipt('receipt-123');

      expect(result.id).toBe('receipt-123');
      expect(result.details).toMatchObject({
        vendorName: 'Coffee Shop',
        total: 6.0,
      });
    });

    it('should throw NotFoundException when receipt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getReceipt('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt and associated image', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        userId: 'user-1',
        imageKey: 'receipts/user-1/image.jpg',
      } as ReceiptExtraction;

      repository.findOne.mockResolvedValue(mockReceipt);
      storage.deleteObject.mockResolvedValue(undefined);
      repository.remove.mockResolvedValue(mockReceipt);

      await service.deleteReceipt('receipt-123', 'user-1');

      expect(storage.deleteObject).toHaveBeenCalledWith(
        'receipts/user-1/image.jpg',
      );
      expect(repository.remove).toHaveBeenCalledWith(mockReceipt);
    });

    it('should throw NotFoundException when receipt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteReceipt('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when userId does not match', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        userId: 'user-1',
      } as ReceiptExtraction;

      repository.findOne.mockResolvedValue(mockReceipt);

      await expect(
        service.deleteReceipt('receipt-123', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExtractionResult', () => {
    it('should update extraction result mapping DTO to persistence model', async () => {
      const mockReceipt = {
        id: 'r1',
        userId: 'u1',
        originalName: 'receipt.png',
        imageKey: 'receipts/u1/receipt.png',
        status: ExtractionStatus.EXTRACTING,
        vendorName: null,
        date: null,
        currency: null,
        items: null,
        tax: null,
        total: null,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      } as ReceiptExtraction;

      repository.findOne.mockResolvedValue(mockReceipt);
      repository.save.mockResolvedValue(mockReceipt);

      await service.updateExtractionResult('r1', {
        status: ExtractionStatus.EXTRACTED,
        details: {
          vendorName: 'Coffee Shop',
          date: '2024-11-30',
          currency: 'SGD',
          items: [
            { name: 'Latte', amount: 5.5 },
            { name: 'Muffin', amount: 4.0 },
          ],
          tax: 0.9,
          total: 10.4,
        },
        failureReason: null,
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExtractionStatus.EXTRACTED,
          vendorName: 'Coffee Shop',
          date: '2024-11-30',
          currency: 'SGD',
          items: [
            { name: 'Latte', amount: 5.5 },
            { name: 'Muffin', amount: 4.0 },
          ],
          tax: 0.9,
          total: 10.4,
          failureReason: null,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should update receipt with invalid status and failure reason', async () => {
      const mockReceipt = {
        id: 'r2',
        status: ExtractionStatus.EXTRACTING,
      } as ReceiptExtraction;

      repository.findOne.mockResolvedValue(mockReceipt);
      repository.save.mockResolvedValue(mockReceipt);

      await service.updateExtractionResult('r2', {
        status: ExtractionStatus.INVALID,
        details: null,
        failureReason: 'Not a valid receipt',
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExtractionStatus.INVALID,
          failureReason: 'Not a valid receipt',
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when receipt not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateExtractionResult('nonexistent', {
          status: ExtractionStatus.EXTRACTED,
          details: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
