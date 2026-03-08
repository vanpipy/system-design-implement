import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TransactionQueryParams {
  accountId: string;
  accountType: string;
  currency: string;
  from?: string;
  to?: string;
  businessRefNo?: string;
}

interface TransactionItem {
  transactionNo: string;
  requestId: string;
  batchId: string;
  transactionType: string;
  direction: string;
  amount: string;
  beforeBalance: string;
  afterBalance: string;
  status: string;
  businessRefNo: string | null;
  transactionTime: string;
  accountingDate: string;
}

@Injectable()
export class TransactionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async queryTransactions(
    params: TransactionQueryParams,
  ): Promise<TransactionItem[]> {
    const { accountId, accountType, currency, from, to, businessRefNo } =
      params;

    const where: Record<string, unknown> = {
      accountId,
      accountType,
      currency,
    };

    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {};

      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          range.gte = fromDate;
        }
      }

      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          range.lte = toDate;
        }
      }

      if (range.gte || range.lte) {
        (
          where as { transactionTime?: { gte?: Date; lte?: Date } }
        ).transactionTime = range;
      }
    }

    if (businessRefNo) {
      where.businessRefNo = businessRefNo;
    }

    const transactions = await this.prisma.balanceTransaction.findMany({
      where: where as never,
      orderBy: {
        transactionTime: 'asc',
      },
    });

    return transactions.map<TransactionItem>((tx) => ({
      transactionNo: tx.transactionNo,
      requestId: tx.requestId,
      batchId: tx.batchId,
      transactionType: tx.transactionType,
      direction: tx.direction,
      amount: tx.amount.toFixed(2),
      beforeBalance: tx.beforeBalance.toFixed(2),
      afterBalance: tx.afterBalance.toFixed(2),
      status: tx.status,
      businessRefNo: tx.businessRefNo ?? null,
      transactionTime: tx.transactionTime.toISOString(),
      accountingDate: tx.accountingDate.toISOString().slice(0, 10),
    }));
  }
}
