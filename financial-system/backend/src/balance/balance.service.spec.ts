import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { BalanceRepository } from './balance.repository';
import { IdempotencyRepository } from './idempotency.repository';
import { TransactionManager } from './transaction-manager';

describe('BalanceService', () => {
  let service: BalanceService;
  let findAccountBalance: jest.Mock;
  let runInTransaction: jest.Mock;

  beforeEach(async () => {
    findAccountBalance = jest.fn();
    runInTransaction = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: BalanceRepository,
          useValue: {
            findAccountBalance,
          },
        },
        {
          provide: IdempotencyRepository,
          useValue: {},
        },
        {
          provide: TransactionManager,
          useValue: {
            runInTransaction,
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

    const result = await service.applyTransactions();

    expect(runInTransaction).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
