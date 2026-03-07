import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('BalanceModule Transactions Query (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should query transactions by account, date range and businessRefNo', async () => {
    const account = {
      accountId: 'ACC_US3_TX_QUERY_001',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const depositBody = {
      requestId: 'REQ-US3-TX-QUERY-INIT',
      idempotencyKey: 'IDEMP-US3-TX-QUERY-INIT',
      account,
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
          businessRefNo: 'ORDER-US3-TX-INIT',
          oppositeAccount: 'OPP-US3-TX-INIT',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const paymentBody = {
      requestId: 'REQ-US3-TX-QUERY-1',
      idempotencyKey: 'IDEMP-US3-TX-QUERY-1',
      account,
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '40.00',
          businessRefNo: 'ORDER-US3-TX-1',
          oppositeAccount: 'OPP-US3-TX-1',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const anotherPaymentBody = {
      requestId: 'REQ-US3-TX-QUERY-2',
      idempotencyKey: 'IDEMP-US3-TX-QUERY-2',
      account,
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '10.00',
          businessRefNo: 'ORDER-US3-TX-2',
          oppositeAccount: 'OPP-US3-TX-2',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const depositRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(depositBody);

    expect(depositRes.status).toBe(201);
    expect(depositRes.body.status).toBe('SUCCESS');

    const paymentRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(paymentBody);

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.status).toBe('SUCCESS');

    const anotherPaymentRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(anotherPaymentBody);

    expect(anotherPaymentRes.status).toBe(201);
    expect(anotherPaymentRes.body.status).toBe('SUCCESS');

    const txRes = await request(app.getHttpServer())
      .get('/balances/transactions')
      .query({
        accountId: account.accountId,
        accountType: account.accountType,
        currency: account.currency,
        from: '2000-01-01T00:00:00.000Z',
        to: '2100-01-01T00:00:00.000Z',
        businessRefNo: 'ORDER-US3-TX-1',
      });

    expect(txRes.status).toBe(200);
    expect(Array.isArray(txRes.body.items)).toBe(true);

    const items = txRes.body.items;
    expect(items.length).toBe(1);

    const tx = items[0];

    expect(tx.accountingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tx.transactionNo).toBeDefined();
    expect(tx.requestId).toBe(paymentBody.requestId);
    expect(tx.transactionType).toBe('PAYMENT');
    expect(tx.direction).toBe('DEBIT');
    expect(tx.amount).toBe('40.00');
    expect(tx.beforeBalance).toBe('100.00');
    expect(tx.afterBalance).toBe('60.00');
    expect(tx.status).toBe('SUCCESS');
    expect(tx.businessRefNo).toBe('ORDER-US3-TX-1');
    expect(typeof tx.transactionTime).toBe('string');
  });
});
