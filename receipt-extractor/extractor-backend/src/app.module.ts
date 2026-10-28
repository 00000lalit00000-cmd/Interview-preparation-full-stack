import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { loadConfig } from './config';
import { DatabaseModule } from './database/database.module';
import { ReceiptsModule } from './receipts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => loadConfig()],
    }),
    DatabaseModule,
    BullModule.forRootAsync({
      useFactory: () => {
        const { redisUrl } = loadConfig();
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
    ReceiptsModule,
  ],
})
export class AppModule {}
