import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('BalanceModule Overdraft Batch (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should reject a batch when all debits would cause overdraft', async () => {
    const account = {
      accountId: 'ACC_US2_OD_001',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const initialDepositBody = {
      requestId: 'REQ-US2-OD-INIT',
      idempotencyKey: 'IDEMP-US2-OD-INIT',
      account,
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
          businessRefNo: 'ORDER-US2-INIT',
          oppositeAccount: 'OPP-US2-INIT',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const initialRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(initialDepositBody);

    expect(initialRes.status).toBe(201);
    expect(initialRes.body.status).toBe('SUCCESS');
    expect(initialRes.body.account.afterBalance).toBe('100.00');

    const overdraftBody = {
      requestId: 'REQ-US2-OD-1',
      idempotencyKey: 'IDEMP-US2-OD-1',
      account,
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '30.00',
          businessRefNo: 'ORDER-US2-OD-1',
          oppositeAccount: 'OPP-US2-OD-1',
          oppositeAccountType: 'MERCHANT',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '40.00',
          businessRefNo: 'ORDER-US2-OD-2',
          oppositeAccount: 'OPP-US2-OD-2',
          oppositeAccountType: 'MERCHANT',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '50.00',
          businessRefNo: 'ORDER-US2-OD-3',
          oppositeAccount: 'OPP-US2-OD-3',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const overdraftRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send(overdraftBody);

    expect(overdraftRes.status).toBe(400);
    expect(overdraftRes.body.status).toBe('REJECTED');
    expect(overdraftRes.body.errorCode).toBe('INSUFFICIENT_FUNDS');
    expect(overdraftRes.body.account.accountId).toBe(account.accountId);
    expect(overdraftRes.body.account.beforeBalance).toBe('100.00');
    expect(overdraftRes.body.account.afterBalance).toBe('100.00');

    const balanceCheckRes = await request(app.getHttpServer())
      .post('/balances/transactions')
      .send({
        requestId: 'REQ-US2-OD-CHECK',
        idempotencyKey: 'IDEMP-US2-OD-CHECK',
        account,
        transactions: [],
      });

    expect(balanceCheckRes.status).toBe(201);
    expect(balanceCheckRes.body.status).toBe('SUCCESS');
    expect(balanceCheckRes.body.account.beforeBalance).toBe('100.00');
    expect(balanceCheckRes.body.account.afterBalance).toBe('100.00');
  });
});
