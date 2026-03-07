import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('GET /balances positive case (e2e)', () => {
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

  it('should return 200 and stringified fields for an existing account', async () => {
    const account = { accountId: 'ACC-POS', accountType: 'CASH', currency: 'CNY' };

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

    // Query balance
    const res = await request(http).get('/balances').query(account);
    expect(res.status).toBe(200);
    expect(res.body.accountId).toBe('ACC-POS');
    expect(res.body.accountType).toBe('CASH');
    expect(res.body.currency).toBe('CNY');
    expect(res.body.balance).toBe('12.34');
    expect(['0.00', '0']).toContain(res.body.frozenBalance);
    expect(res.body.totalBalance).toBe('12.34');
    expect(res.body.minBalance).toBe('0.00');
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.allowNegative).toBe(false);
    expect(
      typeof res.body.updatedAt === 'string' || res.body.updatedAt === undefined,
    ).toBe(true);
  });
});
