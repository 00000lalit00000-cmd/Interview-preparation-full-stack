import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { ReceiptItemDto } from './receipt-item.dto';

export class ReceiptExtractionResultDto {
  @IsString()
  vendorName!: string;

  @IsString()
  date!: string;

  @IsString()
  currency!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items!: ReceiptItemDto[];

  @IsNumber()
  tax!: number;

  @IsNumber()
  total!: number;
}
