import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  async cleanExpired(): Promise<{ count: number }> {
    const now = new Date();
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: {
        expiredAt: { lt: now },
        NOT: { status: 'PROCESSING' },
      },
    } as never);
    return { count: (result as { count: number }).count ?? 0 };
  }
}
