import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, map } from 'rxjs';
import { ReceiptsService } from './services/receipts.service';
import { ReceiptEventsService } from './services/receipt-events.service';
import { SubmitReceiptDto } from './dto/submit-receipt.dto';
import { Response } from 'express';

@Controller('receipts')
export class ReceiptsController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly receiptEventsService: ReceiptEventsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async submitReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SubmitReceiptDto,
  ) {
    if (!file) {
      return {
        success: false,
        message: 'File is required',
      };
    }
    const summary = await this.receiptsService.createReceipt(body.userId, file);
    return {
      success: true,
      receipt: summary,
    };
  }

  @Get()
  async listReceipts(@Query('userId') userId: string) {
    const receipts = await this.receiptsService.listReceipts(userId);
    return { receipts };
  }

  @Sse('events')
  sseEvents(@Query('userId') userId: string): Observable<MessageEvent> {
    return this.receiptEventsService.subscribe(userId).pipe(
      map(
        (event): MessageEvent => ({
          data: event,
        }),
      ),
    );
  }

  @Get(':id')
  async getReceipt(@Param('id', new ParseUUIDPipe()) id: string) {
    const detail = await this.receiptsService.getReceipt(id);
    return { receipt: detail };
  }

  @Get(':id/image')
  async getImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const stream = await this.receiptsService.getReceiptImageStream(id);
    res.setHeader('Content-Type', 'image/jpeg');
    stream.pipe(res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReceipt(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('userId') userId: string,
  ) {
    await this.receiptsService.deleteReceipt(id, userId);
  }
}
