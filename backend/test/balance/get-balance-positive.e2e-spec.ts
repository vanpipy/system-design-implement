import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('POST /balances positive case (e2e)', () => {
  let app: INestApplication;
  let http: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    http = app.getHttpServer() as unknown as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 and stringified fields for existing accounts (batch)', async () => {
    const account = {
      accountId: 'ACC-POS',
      accountType: 'CASH',
      currency: 'CNY',
    };

    // Seed by creating a deposit via transactions endpoint
    const postRes = await request(http)
      .post('/balances/transactions')
      .send({
        requestId: 'REQ-POS-1',
        idempotencyKey: 'IDEMP-POS-1',
        account,
        transactions: [
          {
            transactionType: 'DEPOSIT',
            direction: 'CREDIT',
            amount: '12.34',
          },
        ],
      });
    expect([200, 201]).toContain(postRes.status);
    expect(postRes.body?.status).toBe('SUCCESS');

    // Batch query: include an existing account and a non-existent one
    const res = await request(http)
      .post('/balances')
      .send({
        accounts: [
          account,
          { accountId: 'ACC-NOT-EXIST', accountType: 'CASH', currency: 'CNY' },
        ],
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2);
    const found = res.body.items[0];
    expect(found.accountId).toBe('ACC-POS');
    expect(found.accountType).toBe('CASH');
    expect(found.currency).toBe('CNY');
    expect(found.balance).toBe('12.34');
    expect(['0.00', '0']).toContain(found.frozenBalance);
    expect(found.totalBalance).toBe('12.34');
    expect(found.minBalance).toBe('0.00');
    expect(found.status).toBe('ACTIVE');
    expect(found.allowNegative).toBe(false);
    expect(
      typeof found.updatedAt === 'string' || found.updatedAt === undefined,
    ).toBe(true);

    const notFound = res.body.items[1];
    expect(notFound).toMatchObject({
      accountId: 'ACC-NOT-EXIST',
      accountType: 'CASH',
      currency: 'CNY',
      status: 'NOT_FOUND',
    });
  });
});
