import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('BalanceModule Concurrency (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should handle concurrent balance updates correctly for a single account', async () => {
    const account = {
      accountId: 'ACC_CONC_001',
      accountType: 'CASH',
      currency: 'CNY',
    };

    const requestBody = {
      requestId: 'REQ-CONC-1',
      idempotencyKey: 'IDEMP-CONC-1',
      account,
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
          businessRefNo: 'ORDER-1',
          oppositeAccount: 'OPP-1',
          oppositeAccountType: 'MERCHANT',
        },
      ],
    };

    const concurrency = 10;
    const responses = await Promise.all(
      Array.from({ length: concurrency }).map((_, index) =>
        request(app.getHttpServer())
          .post('/balances/transactions')
          .send({
            ...requestBody,
            requestId: `REQ-CONC-${index + 1}`,
            idempotencyKey: `IDEMP-CONC-${index + 1}`,
          }),
      ),
    );

    responses.forEach((res) => {
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('SUCCESS');
      expect(res.body).toHaveProperty('account');
      expect(res.body.account).toMatchObject({
        accountId: account.accountId,
        accountType: account.accountType,
        currency: account.currency,
      });
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions[0]).toHaveProperty('transactionNo');
    });
  });
});
