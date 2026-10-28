import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitReceiptDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
