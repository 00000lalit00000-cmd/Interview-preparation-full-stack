import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './services/receipts.service';
import { ReceiptEventsService } from './services/receipt-events.service';
import { SubmitReceiptDto } from './dto/submit-receipt.dto';
import { ExtractionStatus } from '../database/entities/receipt-extraction.entity';

describe('ReceiptsController', () => {
  let controller: ReceiptsController;
  let service: jest.Mocked<ReceiptsService>;

  beforeEach(async () => {
    service = {
      createReceipt: jest.fn(),
      listReceipts: jest.fn(),
      getReceipt: jest.fn(),
      getReceiptImageStream: jest.fn(),
      deleteReceipt: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiptsController],
      providers: [
        { provide: ReceiptsService, useValue: service },
        { provide: ReceiptEventsService, useValue: { getStream: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ReceiptsController>(ReceiptsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitReceipt', () => {
    it('should successfully submit a receipt and return summary', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'receipt.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock-image-data'),
        size: 1024,
      } as any;

      const submitDto: SubmitReceiptDto = {
        userId: 'user-123',
      };

      const mockSummary = {
        id: 'receipt-123',
        userId: 'user-123',
        originalName: 'receipt.jpg',
        status: ExtractionStatus.EXTRACTING,
        createdAt: new Date(),
      };

      service.createReceipt.mockResolvedValue(mockSummary as any);

      const result = await controller.submitReceipt(mockFile, submitDto);

      expect(result).toEqual({
        success: true,
        receipt: mockSummary,
      });
      expect(service.createReceipt).toHaveBeenCalledWith('user-123', mockFile);
    });

    it('should return error when file is not provided', async () => {
      const submitDto: SubmitReceiptDto = {
        userId: 'user-123',
      };

      const result = await controller.submitReceipt(undefined as any, submitDto);

      expect(result).toEqual({
        success: false,
        message: 'File is required',
      });
      expect(service.createReceipt).not.toHaveBeenCalled();
    });
  });

  describe('listReceipts', () => {
    it('should return list of receipts for a user', async () => {
      const mockReceipts = [
        {
          id: 'receipt-1',
          userId: 'user-123',
          originalName: 'receipt1.jpg',
          status: ExtractionStatus.EXTRACTED,
          createdAt: new Date('2024-11-30'),
        },
        {
          id: 'receipt-2',
          userId: 'user-123',
          originalName: 'receipt2.jpg',
          status: ExtractionStatus.EXTRACTING,
          createdAt: new Date('2024-12-01'),
        },
      ];

      service.listReceipts.mockResolvedValue(mockReceipts as any);

      const result = await controller.listReceipts('user-123');

      expect(result).toEqual({ receipts: mockReceipts });
      expect(service.listReceipts).toHaveBeenCalledWith('user-123');
    });

    it('should return empty list when user has no receipts', async () => {
      service.listReceipts.mockResolvedValue([]);

      const result = await controller.listReceipts('user-456');

      expect(result).toEqual({ receipts: [] });
    });
  });

  describe('getReceipt', () => {
    it('should return receipt details by id', async () => {
      const mockDetail = {
        id: 'receipt-123',
        userId: 'user-123',
        originalName: 'receipt.jpg',
        status: ExtractionStatus.EXTRACTED,
        vendorName: 'Coffee Shop',
        date: '2024-11-30',
        currency: 'USD',
        items: [{ name: 'Latte', amount: 5.5 }],
        tax: 0.5,
        total: 6.0,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      service.getReceipt.mockResolvedValue(mockDetail as any);

      const result = await controller.getReceipt('receipt-123');

      expect(result).toEqual({ receipt: mockDetail });
      expect(service.getReceipt).toHaveBeenCalledWith('receipt-123');
    });
  });

  describe('getImage', () => {
    it('should stream receipt image with correct content type', async () => {
      const mockStream = {
        pipe: jest.fn(),
      } as any;

      const mockResponse = {
        setHeader: jest.fn(),
      } as any;

      service.getReceiptImageStream.mockResolvedValue(mockStream);

      await controller.getImage('receipt-123', mockResponse);

      expect(service.getReceiptImageStream).toHaveBeenCalledWith('receipt-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/jpeg',
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt successfully', async () => {
      service.deleteReceipt.mockResolvedValue(undefined);

      await controller.deleteReceipt('receipt-123', 'user-123');

      expect(service.deleteReceipt).toHaveBeenCalledWith(
        'receipt-123',
        'user-123',
      );
    });
  });
});
