import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReceiptExtraction,
  ExtractionStatus,
} from '../../database/entities/receipt-extraction.entity';
import { StorageService } from '../../storage/storage.service';
import { ReceiptDetailDto } from '../dto/receipt-detail.dto';
import { ReceiptSummaryDto } from '../dto/receipt-summary.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { EnqueueExtractionJobPayload } from '../interfaces/extraction.interface';
import { ReceiptEventsService } from './receipt-events.service';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    @InjectRepository(ReceiptExtraction)
    private readonly receiptRepository: Repository<ReceiptExtraction>,
    private readonly storage: StorageService,
    @InjectQueue('receipt-extraction')
    private readonly queue: Queue<EnqueueExtractionJobPayload>,
    private readonly receiptEvents: ReceiptEventsService,
  ) {}

  async createReceipt(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<ReceiptSummaryDto> {
    if (!file) {
      throw new Error('File is required');
    }
    const key = `receipts/${userId}/${Date.now()}-${file.originalname}`;
    await this.storage.uploadObject(key, file.buffer, file.mimetype);

    const receipt = this.receiptRepository.create({
      userId,
      originalName: file.originalname,
      imageKey: key,
      status: ExtractionStatus.EXTRACTING,
    });
    const savedReceipt = await this.receiptRepository.save(receipt);

    await this.queue.add('extract', { receiptId: savedReceipt.id });

    return this.toSummaryDto(savedReceipt);
  }

  async listReceipts(userId: string): Promise<ReceiptSummaryDto[]> {
    const receipts = await this.receiptRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return receipts.map((r) => this.toSummaryDto(r));
  }

  async getReceipt(id: string): Promise<ReceiptDetailDto> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
    });
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return this.toDetailDto(receipt);
  }

  async deleteReceipt(id: string, userId: string): Promise<void> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
    });
    if (!receipt || receipt.userId !== userId) {
      throw new NotFoundException('Receipt not found');
    }

    await this.storage.deleteObject(receipt.imageKey);
    await this.receiptRepository.remove(receipt);
  }

  async getReceiptImageStream(id: string) {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
    });
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return this.storage.getObjectStream(receipt.imageKey);
  }

  async getReceiptForProcessing(id: string) {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
    });
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return receipt;
  }

  async updateExtractionResult(
    id: string,
    update: {
      status: ExtractionStatus;
      details?: {
        vendorName: string;
        date: string;
        currency: string;
        items: { name: string; amount: number }[];
        tax: number;
        total: number;
      } | null;
      failureReason?: string | null;
    },
  ): Promise<void> {
    const receipt = await this.receiptRepository.findOne({ where: { id } });
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    receipt.status = update.status;
    receipt.vendorName = update.details?.vendorName ?? null;
    receipt.date = update.details?.date ?? null;
    receipt.currency = update.details?.currency ?? null;
    receipt.items = update.details?.items ?? null;
    receipt.tax = update.details?.tax ?? null;
    receipt.total = update.details?.total ?? null;
    receipt.failureReason = update.failureReason ?? null;
    receipt.completedAt =
      update.status === ExtractionStatus.EXTRACTED ||
      update.status === ExtractionStatus.FAILED ||
      update.status === ExtractionStatus.INVALID
        ? new Date()
        : null;

    await this.receiptRepository.save(receipt);

    // Notify SSE subscribers about the status change
    this.receiptEvents.emit({
      userId: receipt.userId,
      receiptId: id,
      status: update.status,
    });
  }

  private toSummaryDto(receipt: ReceiptExtraction): ReceiptSummaryDto {
    return {
      id: receipt.id,
      originalName: receipt.originalName,
      status: receipt.status as any,
      createdAt: receipt.createdAt.toISOString(),
      imageUrl: `/receipts/${receipt.id}/image`,
    };
  }

  private toDetailDto(receipt: ReceiptExtraction): ReceiptDetailDto {
    const base: ReceiptDetailDto = {
      ...this.toSummaryDto(receipt),
      details: undefined,
      failureReason: receipt.failureReason,
    };

    const hasAnyDetails =
      Boolean(receipt.vendorName) ||
      Boolean(receipt.date) ||
      Boolean(receipt.currency) ||
      (receipt.items != null && Array.isArray(receipt.items)) ||
      receipt.tax != null ||
      receipt.total != null;

    if (hasAnyDetails) {
      base.details = {
        vendorName: receipt.vendorName ?? 'Unknown',
        date: receipt.date ?? '—',
        currency: receipt.currency ?? 'USD',
        items: (receipt.items ?? []) as { name: string; amount: number }[],
        tax: Number(receipt.tax ?? 0),
        total: Number(receipt.total ?? 0),
      };
    }

    return base;
  }
}
