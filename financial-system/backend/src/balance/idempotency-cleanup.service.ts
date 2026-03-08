import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

@Injectable()
export class IdempotencyCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  async cleanExpired(): Promise<{ count: number }> {
    const now = new Date();
    const result: Prisma.BatchPayload =
      await this.prisma.idempotencyRecord.deleteMany({
        where: {
          expiredAt: { lt: now },
          NOT: { status: 'PROCESSING' },
        },
      } as Prisma.IdempotencyRecordDeleteManyArgs);
    return { count: result.count };
  }
}
