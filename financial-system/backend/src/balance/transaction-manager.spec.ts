import { TransactionManager } from './transaction-manager';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionManager', () => {
  let manager: TransactionManager;
  let prisma: PrismaService;
  let transactionMock: jest.Mock;

  beforeEach(() => {
    transactionMock = jest.fn();
    prisma = {
      $transaction: transactionMock,
    } as unknown as PrismaService;

    manager = new TransactionManager(prisma);
  });

  it('should delegate runInTransaction to PrismaService.$transaction', async () => {
    transactionMock.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );

    const fn = jest.fn().mockResolvedValue(42);

    const result = await manager.runInTransaction(fn);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(transactionMock).toHaveBeenCalledWith(fn);
    expect(result).toBe(42);
  });
});
