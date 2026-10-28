import { IsNumber, IsString } from 'class-validator';

export class ReceiptItemDto {
  @IsString()
  name!: string;

  @IsNumber()
  amount!: number;
}
