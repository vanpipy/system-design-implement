import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from '../../src/balance/balance.service';
import { BalanceRepository } from '../../src/balance/balance.repository';
import { IdempotencyRepository } from '../../src/balance/idempotency.repository';
import { TransactionManager } from '../../src/balance/transaction-manager';

describe('Balance failure policy', () => {
  let service: BalanceService;
  let findAccountBalance: jest.Mock;
  let runInTransaction: jest.Mock;
  let findByKeyAndHash: jest.Mock;
  let createIdempotency: jest.Mock;
  let updateIdempotencyById: jest.Mock;
  let createBalanceTransaction: jest.Mock;
  let updateAccountBalanceById: jest.Mock;
  let createBalanceSnapshot: jest.Mock;

  beforeEach(async () => {
    findAccountBalance = jest.fn();
    runInTransaction = jest.fn();
    findByKeyAndHash = jest.fn().mockResolvedValue(null);
    createIdempotency = jest.fn().mockResolvedValue({ id: 1 });
    updateIdempotencyById = jest.fn().mockResolvedValue(null);
    createBalanceTransaction = jest.fn().mockResolvedValue(null);
    updateAccountBalanceById = jest.fn().mockResolvedValue(null);
    createBalanceSnapshot = jest.fn().mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: {
            findAccountBalance,
            createBalanceTransaction,
            updateAccountBalanceById,
            createBalanceSnapshot,
          },
        },
        {
          provide: IdempotencyRepository,
          useValue: {
            findByKeyAndHash,
            create: createIdempotency,
            updateById: updateIdempotencyById,
          },
        },
        {
          provide: TransactionManager,
          useValue: {
            runInTransaction,
            lockAccountBalanceRow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  it('should reject a batch when debits would violate minBalance with allowNegative false', async () => {
    runInTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    findAccountBalance.mockResolvedValue({
      id: 1,
      balance: '100.00',
      frozenBalance: '0.00',
      minBalance: '0.00',
      allowNegative: false,
    });

    const dto = {
      requestId: 'REQ-US2-OD-UNIT-1',
      idempotencyKey: 'IDEMP-US2-OD-UNIT-1',
      account: {
        accountId: 'ACC_US2_OD_UNIT_001',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '30.00',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '40.00',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '50.00',
        },
      ],
    } as never;

    const result = (await service.applyTransactions(dto)) as {
      status: string;
      account: { beforeBalance: string; afterBalance: string };
    };

    expect(result.status).toBe('REJECTED');
    expect(result.account.beforeBalance).toBe('100.00');
    expect(result.account.afterBalance).toBe('100.00');
  });

  it('should succeed when debits and credits respect minBalance constraint', async () => {
    runInTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    findAccountBalance.mockResolvedValue({
      id: 1,
      balance: '100.00',
      frozenBalance: '0.00',
      minBalance: '0.00',
      allowNegative: false,
    });

    const dto = {
      requestId: 'REQ-US2-NO-OD-UNIT-1',
      idempotencyKey: 'IDEMP-US2-NO-OD-UNIT-1',
      account: {
        accountId: 'ACC_US2_NO_OD_UNIT_001',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '30.00',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'DEBIT',
          amount: '40.00',
        },
        {
          transactionType: 'ADJUST',
          direction: 'CREDIT',
          amount: '20.00',
        },
      ],
    } as never;

    const result = (await service.applyTransactions(dto)) as {
      status: string;
      account: { beforeBalance: string; afterBalance: string };
    };

    expect(result.status).toBe('SUCCESS');
    expect(result.account.beforeBalance).toBe('100.00');
    expect(result.account.afterBalance).toBe('50.00');
  });
});
