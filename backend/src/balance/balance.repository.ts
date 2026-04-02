import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/prisma/prisma.types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountBalance(params: {
    accountId: string;
    accountType: string;
    currency: string;
  }) {
    const { accountId, accountType, currency } = params;
    return this.prisma.accountBalance.findUnique({
      where: {
        uk_account_balance_account: {
          accountId,
          accountType,
          currency,
        },
      },
    });
  }

  createAccountBalance(data: Prisma.AccountBalanceCreateInput) {
    return this.prisma.accountBalance.create({
      data,
    });
  }

  updateAccountBalanceById(id: number, data: Prisma.AccountBalanceUpdateInput) {
    return this.prisma.accountBalance.update({
      where: { id },
      data,
    });
  }

  createBalanceTransaction(data: Prisma.BalanceTransactionCreateInput) {
    return this.prisma.balanceTransaction.create({
      data,
    });
  }

  createBalanceSnapshot(data: Prisma.BalanceSnapshotCreateInput) {
    return this.prisma.balanceSnapshot.create({
      data,
    });
  }
}
