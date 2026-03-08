import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { BalanceRepository } from './balance.repository';
import { IdempotencyRepository } from './idempotency.repository';
import { TransactionManager } from './transaction-manager';
import { SnapshotService } from './snapshot.service';
import { TransactionQueryService } from './transaction-query.service';
import { IdempotencyCleanupService } from './idempotency-cleanup.service';

@Module({
  imports: [PrismaModule],
  controllers: [BalanceController],
  providers: [
    BalanceService,
    BalanceRepository,
    IdempotencyRepository,
    TransactionManager,
    SnapshotService,
    TransactionQueryService,
    IdempotencyCleanupService,
  ],
  exports: [BalanceService],
})
export class BalanceModule {}
