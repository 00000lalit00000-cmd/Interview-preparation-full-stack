import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentAnalysisClient,
  AzureKeyCredential,
} from '@azure/ai-form-recognizer';
import { loadConfig } from '../../../config';
import { ReceiptExtractionResultDto } from '../../dto/receipt-extraction-result.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import {
  IExtractionStrategy,
  ExtractionOutcome,
} from '../../interfaces/extraction.interface';

@Injectable()
export class AzureDocumentIntelligenceStrategy implements IExtractionStrategy {
  private readonly client: DocumentAnalysisClient;
  private readonly logger = new Logger(AzureDocumentIntelligenceStrategy.name);

  constructor() {
    const config = loadConfig();
    this.client = new DocumentAnalysisClient(
      config.azureDocumentIntelligence.endpoint,
      new AzureKeyCredential(config.azureDocumentIntelligence.apiKey),
    );
  }

  async extractFromImage(imageBase64: string): Promise<ExtractionOutcome> {
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Use the prebuilt receipt model
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-receipt',
        imageBuffer,
      );

      const { documents } = await poller.pollUntilDone();

      if (!documents || documents.length === 0) {
        return {
          status: 'invalid',
          reason: 'The image does not appear to contain a valid receipt.',
        };
      }

      const receipt = documents[0];

      // If confidence is too low, the image likely isn't a receipt
      if (receipt.confidence !== undefined && receipt.confidence < 0.5) {
        this.logger.warn('Low confidence receipt detection', {
          confidence: receipt.confidence,
        });
        return {
          status: 'invalid',
          reason:
            'Blurry image: The image was too blurry or unclear to process accurately. Please upload a clearer image.',
        };
      }

      const fields = receipt.fields;

      // Extract receipt data from Azure Document Intelligence response
      const vendorName =
        this.extractStringField(fields, 'MerchantName') ||
        this.extractStringField(fields, 'MerchantAddress');
      const date = this.extractDateField(fields, 'TransactionDate');
      const total = this.extractNumberField(fields, 'Total');
      const tax = this.extractNumberField(fields, 'Tax');
      const subtotal = this.extractNumberField(fields, 'Subtotal');
      const items = this.extractItems(fields);

      // Validate that we have essential fields
      if (!vendorName || !date || total === null) {
        this.logger.warn('Missing essential receipt fields', {
          hasVendorName: !!vendorName,
          hasDate: !!date,
          hasTotal: total !== null,
          confidence: receipt.confidence,
        });
        return {
          status: 'invalid',
          reason:
            'The image does not contain a valid receipt. Essential information such as vendor name, date, or total amount could not be extracted. Please ensure the image is clear and contains a complete receipt.',
        };
      }

      // Determine currency - Azure DI may not always provide this, default to USD
      const currency = this.extractCurrency(fields) || 'USD';

      // Calculate tax if not provided but subtotal and total are available
      let finalTax = tax;
      if (finalTax === null && subtotal !== null) {
        finalTax = total - subtotal;
      }
      if (finalTax === null) {
        finalTax = 0;
      }

      // Format date to ISO string
      const formattedDate =
        date instanceof Date
          ? date.toISOString().split('T')[0]
          : date.toString();

      const extractedData: ReceiptExtractionResultDto = {
        vendorName,
        date: formattedDate,
        currency,
        items: items,
        tax: finalTax,
        total,
      };

      // Validate the extracted data
      const dto = plainToInstance(ReceiptExtractionResultDto, extractedData);
      await validateOrReject(dto);

      return {
        status: 'extracted',
        details: dto,
      };
    } catch (error: any) {
      this.logger.error(
        'Error during Azure Document Intelligence extraction',
        error,
      );

      // Handle specific Azure errors
      if (error.statusCode === 400) {
        return {
          status: 'invalid',
          reason:
            'The image format is not supported, the image is corrupted, or the file is too large. Please upload a valid image (JPEG, PNG, BMP, TIFF, or PDF).',
        };
      }

      if (error.statusCode === 401 || error.statusCode === 403) {
        return {
          status: 'failed',
          reason:
            'Azure Document Intelligence authentication failed. Please check your credentials.',
        };
      }

      // Check if error indicates invalid or unreadable image
      if (
        error.message &&
        (error.message.toLowerCase().includes('invalid') ||
          error.message.toLowerCase().includes('unable to read') ||
          error.message.toLowerCase().includes('unsupported'))
      ) {
        return {
          status: 'invalid',
          reason:
            'The image could not be processed. It may be corrupted, too blurry, or in an unsupported format.',
        };
      }

      return {
        status: 'failed',
        reason: error.message || 'Unexpected error during document analysis.',
      };
    }
  }

  private extractStringField(fields: any, fieldName: string): string | null {
    const field = fields[fieldName];
    if (!field) return null;
    if (field.kind === 'string' || field.kind === 'selectionMark') {
      return field.value || null;
    }
    return null;
  }

  private extractNumberField(fields: any, fieldName: string): number | null {
    const field = fields[fieldName];
    if (!field) return null;
    if (field.kind === 'number') {
      return field.value !== undefined ? Number(field.value) : null;
    }
    if (field.kind === 'currency') {
      return field.value?.amount !== undefined
        ? Number(field.value.amount)
        : null;
    }
    return null;
  }

  private extractDateField(
    fields: any,
    fieldName: string,
  ): Date | string | null {
    const field = fields[fieldName];
    if (!field) return null;
    if (field.kind === 'date') {
      return field.value ? new Date(field.value) : null;
    }
    if (field.kind === 'string') {
      // Try to parse date string
      const dateValue = field.value;
      if (dateValue) {
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
        return dateValue;
      }
    }
    return null;
  }

  private extractCurrency(fields: any): string | null {
    const totalField = fields['Total'];
    if (totalField?.kind === 'currency' && totalField.value?.currencySymbol) {
      // Map currency symbols to codes
      const symbolMap: Record<string, string> = {
        $: 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        '₹': 'INR',
        S$: 'SGD',
        A$: 'AUD',
        C$: 'CAD',
      };
      return (
        symbolMap[totalField.value.currencySymbol] ||
        totalField.value.currencyCode ||
        'USD'
      );
    }
    return null;
  }

  private extractItems(fields: any): { name: string; amount: number }[] {
    const items: { name: string; amount: number }[] = [];

    // Try multiple field names for items as Azure DI may use different field names
    const itemsField =
      fields['Items'] || fields['LineItems'] || fields['items'];

    // SDK v5 uses "values" for array fields; fall back to "value" for older formats
    const itemsArray = itemsField?.values || itemsField?.value;

    if (itemsArray && Array.isArray(itemsArray)) {
      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];

        // SDK v5 uses "properties" for object fields; fall back to "value"
        const itemObj = item.properties || item.value;

        if (itemObj) {

          // Extract item name/description
          const descriptionField = itemObj['Description'] || itemObj['description'];
          const nameField = itemObj['Name'] || itemObj['name'];

          let name = 'Item';
          if (descriptionField) {
            name =
              descriptionField.value ||
              descriptionField;
          } else if (nameField) {
            name = nameField.value || nameField;
          }

          // Extract item price - try multiple field names and value types
          let amount = 0;

          // Try TotalPrice first (most common for individual item total)
          const totalPriceField = itemObj['TotalPrice'] || itemObj['totalPrice'];
          if (totalPriceField) {
            // For currency kind, value is { amount, currencyCode, currencySymbol }
            // For number kind, value is the number directly
            if (totalPriceField.kind === 'currency') {
              amount = totalPriceField.value?.amount ?? 0;
            } else {
              amount = totalPriceField.value ?? 0;
            }
          }
          
          // If no TotalPrice, try Price
          if (amount === 0 || amount === null) {
            const priceField = itemObj['Price'] || itemObj['price'];
            if (priceField) {
              if (priceField.kind === 'currency') {
                amount = priceField.value?.amount ?? 0;
              } else {
                amount = priceField.value ?? 0;
              }
            }
          }

          // Only add items with non-zero amounts or non-generic names
          if (amount > 0 || (name && name !== 'Item')) {
            items.push({ 
              name: typeof name === 'string' ? name : String(name), 
              amount: Number(amount) || 0 
            });
          }
        }
      }
    }

    return items;
  }
}
