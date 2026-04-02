import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('BalanceModule Snapshot By Account (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should query snapshots by account and date range', async () => {
    const account = {
      accountId: 'ACC_US3_SNAP_ACC_001',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const firstBody = {
      requestId: 'REQ-US3-SNAP-ACC-1',
      idempotencyKey: 'IDEMP-US3-SNAP-ACC-1',
      account,
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
          businessRefNo: 'ORDER-US3-SNAP-ACC-1',
          oppositeAccount: 'OPP-US3-SNAP-ACC-1',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const secondBody = {
      requestId: 'REQ-US3-SNAP-ACC-2',
      idempotencyKey: 'IDEMP-US3-SNAP-ACC-2',
      account,
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '40.00',
          businessRefNo: 'ORDER-US3-SNAP-ACC-2',
          oppositeAccount: 'OPP-US3-SNAP-ACC-2',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const firstRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(firstBody);

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.status).toBe('SUCCESS');

    const secondRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(secondBody);

    expect(secondRes.status).toBe(201);
    expect(secondRes.body.status).toBe('SUCCESS');

    const snapshotRes = await request(app.getHttpServer())
      .get('/balances/snapshots')
      .query({
        accountId: account.accountId,
        accountType: account.accountType,
        currency: account.currency,
        from: '2000-01-01T00:00:00.000Z',
        to: '2100-01-01T00:00:00.000Z',
      });

    expect(snapshotRes.status).toBe(200);
    expect(Array.isArray(snapshotRes.body.items)).toBe(true);

    const items = snapshotRes.body.items;
    expect(items.length).toBeGreaterThanOrEqual(2);

    const firstSnapshot = items.find(
      (item: { requestId: string }) => item.requestId === firstBody.requestId,
    );
    const secondSnapshot = items.find(
      (item: { requestId: string }) => item.requestId === secondBody.requestId,
    );

    expect(firstSnapshot).toBeDefined();
    expect(secondSnapshot).toBeDefined();

    expect(firstSnapshot.beforeBalance).toBe('0.00');
    expect(firstSnapshot.afterBalance).toBe('100.00');

    expect(secondSnapshot.beforeBalance).toBe('100.00');
    expect(secondSnapshot.afterBalance).toBe('60.00');
  });
});
