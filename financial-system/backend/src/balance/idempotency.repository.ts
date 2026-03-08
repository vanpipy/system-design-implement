import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/prisma/prisma.types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class IdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKeyAndHash(params: { idempotencyKey: string; requestHash: string }) {
    const { idempotencyKey, requestHash } = params;
    return this.prisma.idempotencyRecord.findUnique({
      where: {
        uk_idempotency_key_hash: {
          idempotencyKey,
          requestHash,
        },
      },
    });
  }

  create(data: Prisma.IdempotencyRecordCreateInput) {
    return this.prisma.idempotencyRecord.create({
      data,
    });
  }

  updateById(id: number, data: Prisma.IdempotencyRecordUpdateInput) {
    return this.prisma.idempotencyRecord.update({
      where: { id },
      data,
    });
  }
}
