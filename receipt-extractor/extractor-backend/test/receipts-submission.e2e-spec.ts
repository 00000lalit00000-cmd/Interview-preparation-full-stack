import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('Receipt Submission Pipeline (e2e)', () => {
  let app: INestApplication;
  let queue: Queue;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    queue = moduleFixture.get<Queue>(getQueueToken('receipt-extraction'));
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });
    await queue.close();
    await app.close();
  });

  beforeEach(async () => {
    // Clean queue before each test
    await queue.drain();
  });

  describe('POST /receipts - Receipt Submission to Queueing Flow', () => {
    it('should submit receipt, upload to storage, create database record, and queue extraction job', async () => {
      const userId = 'test-user-123';
      const imageBuffer = Buffer.from('fake-image-data');

      // Step 1: Submit receipt
      const response = await request(app.getHttpServer())
        .post('/receipts')
        .field('userId', userId)
        .attach('file', imageBuffer, {
          filename: 'test-receipt.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      // Step 2: Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.receipt).toMatchObject({
        id: expect.any(String),
        originalName: 'test-receipt.jpg',
        status: 'extracting',
        createdAt: expect.any(String),
        imageUrl: expect.stringContaining('/receipts/'),
      });

      const receiptId = response.body.receipt.id;

      // Step 3: Verify receipt is retrievable
      const getResponse = await request(app.getHttpServer())
        .get(`/receipts/${receiptId}`)
        .expect(200);

      expect(getResponse.body.receipt).toMatchObject({
        id: receiptId,
        originalName: 'test-receipt.jpg',
        status: 'extracting',
      });

      // Step 4: Verify extraction job was queued
      const jobs = await queue.getJobs(['waiting', 'active']);
      const queuedJob = jobs.find((job) => job.data.receiptId === receiptId);

      expect(queuedJob).toBeDefined();
      expect(queuedJob?.data).toEqual({
        receiptId,
      });

      // Step 5: Verify image is accessible
      await request(app.getHttpServer())
        .get(`/receipts/${receiptId}/image`)
        .expect(200)
        .expect('Content-Type', 'image/jpeg');

      // Cleanup: Delete the receipt
      await request(app.getHttpServer())
        .delete(`/receipts/${receiptId}`)
        .query({ userId })
        .expect(204);
    });

    it('should reject submission without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/receipts')
        .field('userId', 'test-user-456')
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('File is required');

      // Verify no jobs were queued
      const jobs = await queue.getJobs(['waiting', 'active']);
      expect(jobs.length).toBe(0);
    });

    it('should handle multiple receipt submissions for same user', async () => {
      const userId = 'test-user-789';
      const imageBuffer = Buffer.from('fake-image-data');

      // Submit first receipt
      const response1 = await request(app.getHttpServer())
        .post('/receipts')
        .field('userId', userId)
        .attach('file', imageBuffer, {
          filename: 'receipt1.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      // Submit second receipt
      const response2 = await request(app.getHttpServer())
        .post('/receipts')
        .field('userId', userId)
        .attach('file', imageBuffer, {
          filename: 'receipt2.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.receipt.id).not.toBe(response2.body.receipt.id);

      // Verify both jobs are queued
      const jobs = await queue.getJobs(['waiting', 'active']);
      expect(jobs.length).toBeGreaterThanOrEqual(2);

      // Verify list receipts returns both
      const listResponse = await request(app.getHttpServer())
        .get('/receipts')
        .query({ userId })
        .expect(200);

      expect(listResponse.body.receipts.length).toBeGreaterThanOrEqual(2);
      const receiptIds = listResponse.body.receipts.map((r: any) => r.id);
      expect(receiptIds).toContain(response1.body.receipt.id);
      expect(receiptIds).toContain(response2.body.receipt.id);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/receipts/${response1.body.receipt.id}`)
        .query({ userId })
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/receipts/${response2.body.receipt.id}`)
        .query({ userId })
        .expect(204);
    });

    it('should prevent deletion by wrong user', async () => {
      const userId1 = 'user-owner';
      const userId2 = 'user-attacker';
      const imageBuffer = Buffer.from('fake-image-data');

      // Create receipt as user1
      const response = await request(app.getHttpServer())
        .post('/receipts')
        .field('userId', userId1)
        .attach('file', imageBuffer, {
          filename: 'receipt.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      const receiptId = response.body.receipt.id;

      // Try to delete as user2
      await request(app.getHttpServer())
        .delete(`/receipts/${receiptId}`)
        .query({ userId: userId2 })
        .expect(404);

      // Verify receipt still exists
      await request(app.getHttpServer())
        .get(`/receipts/${receiptId}`)
        .expect(200);

      // Cleanup with correct user
      await request(app.getHttpServer())
        .delete(`/receipts/${receiptId}`)
        .query({ userId: userId1 })
        .expect(204);
    });
  });
});
