import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SnapshotQueryParams {
  requestId?: string;
  accountId?: string;
  accountType?: string;
  currency?: string;
  from?: string;
  to?: string;
}

interface SnapshotItem {
  snapshotId: number;
  requestId: string;
  accountId: string;
  accountType: string;
  currency: string;
  beforeBalance: string;
  afterBalance: string;
  status: string;
  accountingDate: string;
  createdAt: string;
}

@Injectable()
export class SnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async querySnapshots(params: SnapshotQueryParams): Promise<SnapshotItem[]> {
    const { requestId, accountId, accountType, currency, from, to } = params;

    const where: Record<string, unknown> = {};

    if (requestId) {
      where.requestId = requestId;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (currency) {
      where.currency = currency;
    }

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
          where as { accountingDate?: { gte?: Date; lte?: Date } }
        ).accountingDate = range;
      }
    }

    if (Object.keys(where).length === 0) {
      return [];
    }

    const snapshots = await this.prisma.balanceSnapshot.findMany({
      where: where as never,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return snapshots.map<SnapshotItem>((snapshot) => ({
      snapshotId: snapshot.id,
      requestId: snapshot.requestId,
      accountId: snapshot.accountId,
      accountType: snapshot.accountType,
      currency: snapshot.currency,
      beforeBalance: snapshot.beforeBalance.toFixed(2),
      afterBalance: snapshot.afterBalance.toFixed(2),
      status: snapshot.status,
      accountingDate: snapshot.accountingDate.toISOString().slice(0, 10),
      createdAt: snapshot.createdAt.toISOString(),
    }));
  }
}
