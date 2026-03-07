import { BalanceRepository } from './balance.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('BalanceRepository', () => {
  let repository: BalanceRepository;
  let prisma: PrismaService;
  let findUnique: jest.Mock;
  let update: jest.Mock;
  let create: jest.Mock;

  beforeEach(() => {
    findUnique = jest.fn();
    update = jest.fn();
    create = jest.fn();

    prisma = {
      accountBalance: {
        findUnique,
        update,
      },
      balanceTransaction: {
        create,
      },
    } as unknown as PrismaService;

    repository = new BalanceRepository(prisma);
  });

  it('should query AccountBalance by composite key', async () => {
    const params = {
      accountId: 'acc1',
      accountType: 'CASH',
      currency: 'CNY',
    };
    const expected = { id: 1 };

    findUnique.mockResolvedValue(expected);

    const result = await repository.findAccountBalance(params);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        uk_account_balance_account: params,
      },
    });
    expect(result).toBe(expected);
  });

  it('should update AccountBalance by id', async () => {
    const data = { balance: 100 };

    await repository.updateAccountBalanceById(1, data as never);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data,
    });
  });

  it('should create BalanceTransaction', async () => {
    const data = { amount: 10 };

    await repository.createBalanceTransaction(data as never);

    expect(create).toHaveBeenCalledWith({
      data,
    });
  });
});
