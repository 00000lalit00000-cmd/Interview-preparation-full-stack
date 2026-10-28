import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ReceiptSummaryDto } from './receipt-summary.dto';
import { ReceiptExtractionResultDto } from './receipt-extraction-result.dto';

export class ReceiptDetailDto extends ReceiptSummaryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ReceiptExtractionResultDto)
  details?: ReceiptExtractionResultDto;

  @IsOptional()
  @IsString()
  failureReason?: string | null;
}
