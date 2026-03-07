import { Injectable } from '@nestjs/common';
import { BalanceRepository } from './balance.repository';
import { IdempotencyRepository } from './idempotency.repository';
import { TransactionManager } from './transaction-manager';

@Injectable()
export class BalanceService {
  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  getBalance(params: {
    accountId: string;
    accountType: string;
    currency: string;
  }) {
    return this.balanceRepository.findAccountBalance(params);
  }

  applyTransactions(): Promise<unknown> {
    return this.transactionManager.runInTransaction(() => {
      return Promise.resolve(null);
    });
  }
}
