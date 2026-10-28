import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { loadConfig } from '../config';

export class StorageService {
  private readonly containerClient: ContainerClient;

  constructor() {
    const config = loadConfig();
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureBlobStorage.connectionString,
    );
    this.containerClient = blobServiceClient.getContainerClient(
      config.azureBlobStorage.containerName,
    );
  }

  async uploadObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    await blockBlobClient.upload(body, body.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
  }

  async deleteObject(key: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    await blockBlobClient.delete();
  }

  async getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    const response = await blockBlobClient.download();
    if (!response.readableStreamBody) {
      throw new Error('Failed to get blob stream');
    }
    return response.readableStreamBody as NodeJS.ReadableStream;
  }

  async getObjectBase64(
    key: string,
  ): Promise<{ base64: string; contentType: string | undefined }> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    const response = await blockBlobClient.download();

    if (!response.readableStreamBody) {
      throw new Error('Failed to download blob');
    }

    const chunks: Buffer[] = [];
    const body = response.readableStreamBody as NodeJS.ReadableStream;
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return {
      base64: buffer.toString('base64'),
      contentType: response.contentType,
    };
  }
}
