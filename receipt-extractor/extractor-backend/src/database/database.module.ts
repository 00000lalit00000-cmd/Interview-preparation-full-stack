import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loadConfig } from '../config';
import { ReceiptExtraction } from './entities/receipt-extraction.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const config = loadConfig();
        return {
          type: 'postgres',
          url: config.databaseUrl,
          entities: [ReceiptExtraction],
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature([ReceiptExtraction]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
