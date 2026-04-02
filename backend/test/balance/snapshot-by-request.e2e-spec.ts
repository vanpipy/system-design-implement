import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('BalanceModule Snapshot By Request (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should query snapshot by requestId', async () => {
    const account = {
      accountId: 'ACC_US3_SNAP_REQ_001',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const requestId = 'REQ-US3-SNAP-REQ-1';

    const body = {
      requestId,
      idempotencyKey: 'IDEMP-US3-SNAP-REQ-1',
      account,
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
          businessRefNo: 'ORDER-US3-SNAP-REQ-1',
          oppositeAccount: 'OPP-US3-SNAP-REQ-1',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const txRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(body);

    expect(txRes.status).toBe(201);
    expect(txRes.body.status).toBe('SUCCESS');

    const snapshotRes = await request(app.getHttpServer())
      .get('/balances/snapshots')
      .query({ requestId });

    expect(snapshotRes.status).toBe(200);
    expect(Array.isArray(snapshotRes.body.items)).toBe(true);
    expect(snapshotRes.body.items.length).toBeGreaterThanOrEqual(1);

    const snapshot = snapshotRes.body.items.find(
      (item: { accountId: string }) => item.accountId === account.accountId,
    );

    expect(snapshot).toBeDefined();
    expect(snapshot.requestId).toBe(requestId);
    expect(snapshot.accountId).toBe(account.accountId);
    expect(snapshot.accountType).toBe(account.accountType);
    expect(snapshot.currency).toBe(account.currency);
    expect(snapshot.beforeBalance).toBe('0.00');
    expect(snapshot.afterBalance).toBe('100.00');
    expect(snapshot.status).toBe('SUCCESS');
    expect(typeof snapshot.snapshotId).toBe('number');
    expect(typeof snapshot.accountingDate).toBe('string');
    expect(typeof snapshot.createdAt).toBe('string');
  });
});
