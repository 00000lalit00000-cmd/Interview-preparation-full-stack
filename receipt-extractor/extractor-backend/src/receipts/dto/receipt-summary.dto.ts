import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ExtractionStatus } from '../../database/entities/receipt-extraction.entity';

export class ReceiptSummaryDto {
  @IsUUID()
  id!: string;

  @IsString()
  originalName!: string;

  @IsEnum(ExtractionStatus)
  status!: ExtractionStatus;

  @IsString()
  createdAt!: string;

  @IsString()
  imageUrl!: string;
}
