import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from '../../src/balance/balance.service';
import { BalanceRepository } from '../../src/balance/balance.repository';
import { IdempotencyRepository } from '../../src/balance/idempotency.repository';
import { TransactionManager } from '../../src/balance/transaction-manager';

describe('BalanceService', () => {
  let service: BalanceService;
  let findAccountBalance: jest.Mock;
  let runInTransaction: jest.Mock;
  let findByKeyAndHash: jest.Mock;
  let createIdempotency: jest.Mock;
  let updateIdempotencyById: jest.Mock;
  let createBalanceTransaction: jest.Mock;
  let updateAccountBalanceById: jest.Mock;
  let createBalanceSnapshot: jest.Mock;
  let createAccountBalance: jest.Mock;

  beforeEach(async () => {
    findAccountBalance = jest.fn();
    runInTransaction = jest.fn();
    findByKeyAndHash = jest.fn().mockResolvedValue(null);
    createIdempotency = jest.fn().mockResolvedValue({ id: 1 });
    updateIdempotencyById = jest.fn().mockResolvedValue(null);
    createBalanceTransaction = jest.fn().mockResolvedValue(null);
    updateAccountBalanceById = jest.fn().mockResolvedValue(null);
    createBalanceSnapshot = jest.fn().mockResolvedValue(null);
    createAccountBalance = jest.fn().mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: {
            findAccountBalance,
            createAccountBalance,
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

  it('should delegate getBalance to BalanceRepository', async () => {
    const params = {
      accountId: 'acc1',
      accountType: 'CASH',
      currency: 'CNY',
    };
    const expected = { id: 1, accountId: 'acc1' };

    findAccountBalance.mockResolvedValue(expected);

    const result = await service.getBalance(params);

    expect(findAccountBalance).toHaveBeenCalledWith(params);
    expect(result).toBe(expected);
  });

  it('should delegate applyTransactions to TransactionManager.runInTransaction', async () => {
    runInTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    const dto = {
      requestId: 'REQ-1',
      idempotencyKey: 'IDEMP-1',
      account: {
        accountId: 'acc1',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [],
    } as never;

    await service.applyTransactions(dto);

    expect(runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('should execute applyTransactions inside a single transaction for a batch request', async () => {
    const dto = {
      requestId: 'REQ-1',
      idempotencyKey: 'IDEMP-1',
      account: {
        accountId: 'acc1',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [],
    } as never;

    await service.applyTransactions(dto);

    expect(runInTransaction).toHaveBeenCalledTimes(1);
    const [handler] = runInTransaction.mock.calls[0] as [
      () => Promise<unknown>,
    ];
    expect(typeof handler).toBe('function');
  });

  it('should propagate errors so that transaction is rolled back when an error occurs', async () => {
    runInTransaction.mockImplementation(() =>
      Promise.reject(new Error('DB_ERROR')),
    );

    const dto = {
      requestId: 'REQ-1',
      idempotencyKey: 'IDEMP-1',
      account: {
        accountId: 'acc1',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [],
    } as never;

    await expect(service.applyTransactions(dto)).rejects.toThrow('DB_ERROR');

    expect(createIdempotency).toHaveBeenCalledTimes(1);
    expect(updateIdempotencyById).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('should return cached response when idempotency record exists with SUCCESS', async () => {
    const cached = {
      requestId: 'REQ-1',
      status: 'SUCCESS',
    };

    findByKeyAndHash.mockResolvedValue({
      id: 1,
      status: 'SUCCESS',
      responseData: cached,
    });

    const dto = {
      requestId: 'REQ-1',
      idempotencyKey: 'IDEMP-1',
      account: {
        accountId: 'acc1',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [],
    } as never;

    const result = await service.applyTransactions(dto);

    expect(result).toBe(cached);
    expect(runInTransaction).not.toHaveBeenCalled();
    expect(createIdempotency).not.toHaveBeenCalled();
    expect(updateIdempotencyById).not.toHaveBeenCalled();
  });

  it('should handle multiple decimal transactions and chain before/after balances correctly', async () => {
    runInTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    findAccountBalance.mockResolvedValue({
      id: 1,
      balance: '0.00',
      frozenBalance: '0.00',
    });

    const dto = {
      requestId: 'REQ-DECIMAL-1',
      idempotencyKey: 'IDEMP-DECIMAL-1',
      account: {
        accountId: 'acc-decimal',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [
        {
          transactionType: 'PAYMENT',
          direction: 'CREDIT',
          amount: '0.10',
        },
        {
          transactionType: 'PAYMENT',
          direction: 'CREDIT',
          amount: '0.20',
        },
      ],
    } as never;

    const result = (await service.applyTransactions(dto)) as {
      account: { beforeBalance: string; afterBalance: string };
      transactions: {
        amount: string;
        beforeBalance: string;
        afterBalance: string;
      }[];
    };

    expect(result.account.beforeBalance).toBe('0.00');
    expect(result.account.afterBalance).toBe('0.30');
    expect(result.transactions[0]).toMatchObject({
      amount: '0.10',
      beforeBalance: '0.00',
      afterBalance: '0.10',
    });
    expect(result.transactions[1]).toMatchObject({
      amount: '0.20',
      beforeBalance: '0.10',
      afterBalance: '0.30',
    });

    expect(createBalanceTransaction).toHaveBeenCalledTimes(2);
    expect(updateAccountBalanceById).toHaveBeenCalledTimes(1);
    expect(createBalanceSnapshot).toHaveBeenCalledTimes(1);
  });

  it('should treat missing existing balance as zero when applying transactions', async () => {
    runInTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    findAccountBalance.mockResolvedValue(null);

    const dto = {
      requestId: 'REQ-NO-EXISTING',
      idempotencyKey: 'IDEMP-NO-EXISTING',
      account: {
        accountId: 'acc-new',
        accountType: 'CASH',
        currency: 'CNY',
      },
      transactions: [
        {
          transactionType: 'DEPOSIT',
          direction: 'CREDIT',
          amount: '100.00',
        },
      ],
    } as never;

    const result = (await service.applyTransactions(dto)) as {
      account: { beforeBalance: string; afterBalance: string };
    };

    expect(result.account.beforeBalance).toBe('0.00');
    expect(result.account.afterBalance).toBe('100.00');
  });
});
