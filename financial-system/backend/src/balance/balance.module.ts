import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { BalanceRepository } from './balance.repository';
import { IdempotencyRepository } from './idempotency.repository';
import { TransactionManager } from './transaction-manager';

@Module({
  imports: [PrismaModule],
  controllers: [BalanceController],
  providers: [
    BalanceService,
    BalanceRepository,
    IdempotencyRepository,
    TransactionManager,
  ],
  exports: [BalanceService],
})
export class BalanceModule {}
