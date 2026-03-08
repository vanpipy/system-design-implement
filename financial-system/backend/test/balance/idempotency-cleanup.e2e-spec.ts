import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { IdempotencyCleanupService } from '../../src/balance/idempotency-cleanup.service';

describe('IdempotencyCleanup (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: IdempotencyCleanupService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cleanup = app.get(IdempotencyCleanupService);
  });

  it('should not affect transactions and snapshots after cleanup', async () => {
    const account = {
      accountId: 'ACC-CLEANUP-E2E',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const depositRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send({
        requestId: 'REQ-CLEANUP-1',
        idempotencyKey: 'IDEMP-CLEANUP-1',
        account,
        transactions: [
          { transactionType: 'DEPOSIT', direction: 'CREDIT', amount: '50.00' },
        ],
      });
    expect(depositRes.status).toBe(201);
    expect(depositRes.body.status).toBe('SUCCESS');

    const paymentRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send({
        requestId: 'REQ-CLEANUP-2',
        idempotencyKey: 'IDEMP-CLEANUP-2',
        account,
        transactions: [
          { transactionType: 'PAYMENT', direction: 'DEBIT', amount: '10.00' },
        ],
      });
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.status).toBe('SUCCESS');

    const beforeTx = await request(app.getHttpServer())
      .get('/balances/transactions')
      .query(account);
    expect(beforeTx.status).toBe(200);
    expect(beforeTx.body.items.length).toBeGreaterThan(0);

    const beforeSnapshots = await request(app.getHttpServer())
      .get('/balances/snapshots')
      .query({ requestId: 'REQ-CLEANUP-1' });
    expect(beforeSnapshots.status).toBe(200);
    expect(beforeSnapshots.body.items.length).toBeGreaterThan(0);

    const res = await cleanup.cleanExpired();
    expect(typeof res.count).toBe('number');

    const afterTx = await request(app.getHttpServer())
      .get('/balances/transactions')
      .query(account);
    expect(afterTx.status).toBe(200);
    expect(afterTx.body.items.length).toBeGreaterThan(0);

    const afterSnapshots = await request(app.getHttpServer())
      .get('/balances/snapshots')
      .query({ requestId: 'REQ-CLEANUP-1' });
    expect(afterSnapshots.status).toBe(200);
    expect(afterSnapshots.body.items.length).toBeGreaterThan(0);
  });
});
