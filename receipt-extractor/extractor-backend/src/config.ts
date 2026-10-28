export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  azureBlobStorage: {
    connectionString: string;
    containerName: string;
  };
  azureDocumentIntelligence: {
    endpoint: string;
    apiKey: string;
  };
}

export function loadConfig(): AppConfig {
  const {
    PORT,
    DATABASE_URL,
    REDIS_URL,
    AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME,
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
    AZURE_DOCUMENT_INTELLIGENCE_API_KEY,
  } = process.env;

  if (process.env.NODE_ENV === 'test') {
    return {
      port: Number(PORT) || 3000,
      databaseUrl:
        DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/receipt_extractor_test',
      redisUrl: REDIS_URL || 'redis://localhost:6379',
      azureBlobStorage: {
        connectionString:
          AZURE_STORAGE_CONNECTION_STRING || 'test-connection-string',
        containerName: AZURE_STORAGE_CONTAINER_NAME || 'test-receipts',
      },
      azureDocumentIntelligence: {
        endpoint:
          AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
          'https://test.cognitiveservices.azure.com/',
        apiKey: AZURE_DOCUMENT_INTELLIGENCE_API_KEY || 'test-api-key',
      },
    };
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }

  if (!REDIS_URL) {
    throw new Error('REDIS_URL must be set');
  }

  if (!AZURE_STORAGE_CONTAINER_NAME) {
    throw new Error('AZURE_STORAGE_CONTAINER_NAME must be set');
  }

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING must be set');
  }

  if (
    !AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
    !AZURE_DOCUMENT_INTELLIGENCE_API_KEY
  ) {
    throw new Error(
      'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_API_KEY must be set',
    );
  }

  return {
    port: Number(PORT) || 3000,
    databaseUrl: DATABASE_URL,
    redisUrl: REDIS_URL,
    azureBlobStorage: {
      connectionString: AZURE_STORAGE_CONNECTION_STRING,
      containerName: AZURE_STORAGE_CONTAINER_NAME,
    },
    azureDocumentIntelligence: {
      endpoint: AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
      apiKey: AZURE_DOCUMENT_INTELLIGENCE_API_KEY,
    },
  };
}
