import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/prisma/prisma.types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  async lockAccountBalanceRow(
    tx: Prisma.TransactionClient,
    params: {
      accountId: string;
      accountType: string;
      currency: string;
    },
  ) {
    const { accountId, accountType, currency } = params;

    const url = process.env.DATABASE_URL ?? '';
    if (!url.startsWith('postgresql')) {
      return;
    }

    await tx.$executeRawUnsafe(
      'SELECT 1 FROM "account_balance" WHERE account_id = $1 AND account_type = $2 AND currency = $3 FOR UPDATE',
      accountId,
      accountType,
      currency,
    );
  }
}
