import { Test, TestingModule } from '@nestjs/testing';
import { TransactionQueryService } from '../../src/balance/transaction-query.service';

describe('TransactionQueryService', () => {
  let service: TransactionQueryService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionQueryService,
        {
          provide: 'PrismaService',
          useValue: {
            balanceTransaction: {
              findMany,
            },
          },
        },
      ],
    })
      .useMocker((token) => {
        if (typeof token === 'function' && token.name === 'PrismaService') {
          return {
            balanceTransaction: {
              findMany,
            },
          };
        }
        return undefined;
      })
      .compile();

    service = module.get<TransactionQueryService>(TransactionQueryService);
  });

  it('should map fields and filter by businessRefNo', async () => {
    const txTime = new Date('2026-03-07T10:00:00Z');
    const accDate = new Date('2026-03-07T00:00:00Z');
    findMany.mockResolvedValue([
      {
        transactionNo: 'TX-1',
        requestId: 'REQ-1',
        batchId: 'BATCH-1',
        transactionType: 'PAYMENT',
        direction: 'DEBIT',
        amount: { toFixed: () => '10.00' },
        beforeBalance: { toFixed: () => '100.00' },
        afterBalance: { toFixed: () => '90.00' },
        status: 'SUCCESS',
        businessRefNo: 'ORDER-1',
        transactionTime: txTime,
        accountingDate: accDate,
      },
    ]);

    const res = await service.queryTransactions({
      accountId: 'ACC-1',
      accountType: 'CASH',
      currency: 'CNY',
      businessRefNo: 'ORDER-1',
    });
    expect(findMany).toHaveBeenCalled();
    expect(res).toEqual([
      {
        transactionNo: 'TX-1',
        requestId: 'REQ-1',
        batchId: 'BATCH-1',
        transactionType: 'PAYMENT',
        direction: 'DEBIT',
        amount: '10.00',
        beforeBalance: '100.00',
        afterBalance: '90.00',
        status: 'SUCCESS',
        businessRefNo: 'ORDER-1',
        transactionTime: txTime.toISOString(),
        accountingDate: '2026-03-07',
      },
    ]);
  });
});
