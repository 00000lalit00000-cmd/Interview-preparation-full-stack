import { Test, TestingModule } from '@nestjs/testing';
import { AzureDocumentIntelligenceStrategy } from './azure-document-intelligence.strategy';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';

jest.mock('../../../config', () => ({
  loadConfig: jest.fn(() => ({
    azureDocumentIntelligence: {
      endpoint: 'https://test.cognitiveservices.azure.com/',
      apiKey: 'test-key',
    },
  })),
}));

jest.mock('@azure/ai-form-recognizer');

describe('AzureDocumentIntelligenceStrategy', () => {
  let strategy: AzureDocumentIntelligenceStrategy;
  let mockClient: jest.Mocked<DocumentAnalysisClient>;

  beforeEach(async () => {
    mockClient = {
      beginAnalyzeDocument: jest.fn(),
    } as any;

    (DocumentAnalysisClient as jest.Mock).mockImplementation(() => mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureDocumentIntelligenceStrategy],
    }).compile();

    strategy = module.get<AzureDocumentIntelligenceStrategy>(
      AzureDocumentIntelligenceStrategy,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractFromImage', () => {
    it('should successfully extract receipt data with all fields', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.95,
              fields: {
                MerchantName: { kind: 'string', value: 'Coffee Shop' },
                TransactionDate: { kind: 'date', value: '2024-11-30' },
                Total: { kind: 'currency', value: { amount: 10.4 } },
                Tax: { kind: 'currency', value: { amount: 0.9 } },
                Subtotal: { kind: 'currency', value: { amount: 9.5 } },
                Items: {
                  kind: 'list',
                  value: [
                    {
                      kind: 'object',
                      value: {
                        Name: { kind: 'string', value: 'Latte' },
                        TotalPrice: { kind: 'currency', value: { amount: 5.5 } },
                      },
                    },
                    {
                      kind: 'object',
                      value: {
                        Name: { kind: 'string', value: 'Muffin' },
                        TotalPrice: { kind: 'currency', value: { amount: 4.0 } },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('extracted');
      if (result.status === 'extracted') {
        expect(result.details).toMatchObject({
          vendorName: 'Coffee Shop',
          date: '2024-11-30',
          currency: 'USD',
          total: 10.4,
          tax: 0.9,
          items: [
            { name: 'Latte', amount: 5.5 },
            { name: 'Muffin', amount: 4.0 },
          ],
        });
      }
    });

    it('should return invalid status when no documents are found', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('invalid');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('does not appear to contain a valid receipt');
      }
    });

    it('should return invalid status when confidence is too low', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.3,
              fields: {
                MerchantName: { kind: 'string', value: 'Shop' },
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('invalid');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('Blurry image');
        expect(result.reason).toContain('blurry');
      }
    });

    it('should return invalid status when essential fields are missing', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.9,
              fields: {
                MerchantName: { kind: 'string', value: 'Coffee Shop' },
                // Missing date and total
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('invalid');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('does not contain a valid receipt');
        expect(result.reason).toContain('Essential information');
      }
    });

    it('should calculate tax from subtotal and total when tax is missing', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.95,
              fields: {
                MerchantName: { kind: 'string', value: 'Coffee Shop' },
                TransactionDate: { kind: 'date', value: '2024-11-30' },
                Total: { kind: 'currency', value: { amount: 10.4 } },
                Subtotal: { kind: 'currency', value: { amount: 9.5 } },
                Items: { kind: 'list', value: [] },
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('extracted');
      if (result.status === 'extracted') {
        expect(result.details.tax).toBeCloseTo(0.9, 2);
      }
    });

    it('should handle 400 error with invalid status', async () => {
      const error: any = new Error('Bad request');
      error.statusCode = 400;
      mockClient.beginAnalyzeDocument.mockRejectedValue(error);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('invalid');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('image format is not supported');
      }
    });

    it('should handle authentication errors with failed status', async () => {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;
      mockClient.beginAnalyzeDocument.mockRejectedValue(error);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('failed');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('authentication failed');
      }
    });

    it('should handle unreadable image errors with invalid status', async () => {
      const error = new Error('Unable to read image data');
      mockClient.beginAnalyzeDocument.mockRejectedValue(error);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('invalid');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('could not be processed');
      }
    });

    it('should handle generic errors with failed status', async () => {
      const error = new Error('Network timeout');
      mockClient.beginAnalyzeDocument.mockRejectedValue(error);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('failed');
      if (result.status === 'invalid' || result.status === 'failed') {
        expect(result.reason).toContain('Network timeout');
      }
    });

    it('should use merchant address if merchant name is not available', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.95,
              fields: {
                MerchantAddress: { kind: 'string', value: '123 Main St' },
                TransactionDate: { kind: 'date', value: '2024-11-30' },
                Total: { kind: 'currency', value: { amount: 10.0 } },
                Items: { kind: 'list', value: [] },
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('extracted');
      if (result.status === 'extracted') {
        expect(result.details.vendorName).toBe('123 Main St');
      }
    });

    it('should default tax to 0 when not available and cannot be calculated', async () => {
      const mockPoller = {
        pollUntilDone: jest.fn().mockResolvedValue({
          documents: [
            {
              confidence: 0.95,
              fields: {
                MerchantName: { kind: 'string', value: 'Coffee Shop' },
                TransactionDate: { kind: 'date', value: '2024-11-30' },
                Total: { kind: 'currency', value: { amount: 10.0 } },
                Items: { kind: 'list', value: [] },
              },
            },
          ],
        }),
      };

      mockClient.beginAnalyzeDocument.mockResolvedValue(mockPoller as any);

      const result = await strategy.extractFromImage('base64ImageData');

      expect(result.status).toBe('extracted');
      if (result.status === 'extracted') {
        expect(result.details.tax).toBe(0);
      }
    });
  });
});
