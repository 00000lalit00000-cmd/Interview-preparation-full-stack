import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExtractionStatus {
  EXTRACTING = 'extracting',
  EXTRACTED = 'extracted',
  FAILED = 'failed',
  INVALID = 'invalid',
}

@Entity('receipt_extractions')
@Index(['userId', 'createdAt'])
export class ReceiptExtraction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  originalName!: string;

  @Column({ type: 'varchar' })
  imageKey!: string;

  @Column({
    type: 'enum',
    enum: ExtractionStatus,
    default: ExtractionStatus.EXTRACTING,
  })
  status!: ExtractionStatus;

  @Column({ type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ type: 'varchar', nullable: true })
  vendorName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  date!: string | null;

  @Column({ type: 'varchar', nullable: true })
  currency!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tax!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  items!: { name: string; amount: number }[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;
}
