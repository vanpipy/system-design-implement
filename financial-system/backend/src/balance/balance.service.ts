import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import Decimal from 'decimal.js';
import { BalanceRepository } from './balance.repository';
import { IdempotencyRepository } from './idempotency.repository';
import { TransactionManager } from './transaction-manager';
import { CreateBalanceTransactionsDto } from './dto/create-balance-transactions.dto';
import {
  balanceConfig,
  FAILURE_POLICY_REJECT_BATCH,
} from './config/balance.config';

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

  applyTransactions(dto: CreateBalanceTransactionsDto): Promise<unknown> {
    const requestHash = this.computeRequestHash(dto);
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { accountId, accountType, currency } = dto.account;
    return this.handleWithIdempotency(
      dto.idempotencyKey,
      requestHash,
      expiredAt,
      async () =>
        this.transactionManager.runInTransaction(async (tx) => {
          await this.transactionManager.lockAccountBalanceRow(tx, {
            accountId,
            accountType,
            currency,
          });

          const existing: {
            id: number;
            balance: unknown;
            frozenBalance: unknown;
            minBalance?: unknown;
            allowNegative?: boolean;
          } | null = await this.balanceRepository.findAccountBalance({
            accountId,
            accountType,
            currency,
          });

          const beforeBalanceDecimal = existing
            ? new Decimal(
                (existing.balance as { toString: () => string }).toString(),
              )
            : new Decimal(0);
          const minBalanceDecimal =
            existing && existing.minBalance
              ? new Decimal(
                  (
                    existing.minBalance as { toString: () => string }
                  ).toString(),
                )
              : new Decimal(0);
          const allowNegative =
            existing && typeof existing.allowNegative === 'boolean'
              ? existing.allowNegative
              : false;
          let currentBalance = beforeBalanceDecimal;

          const transactions: {
            transactionNo: string;
            transactionType: string;
            direction: string;
            amount: string;
            beforeBalance: string;
            afterBalance: string;
            businessRefNo?: string | null;
            status: string;
          }[] = [];

          let simulatedBalance = beforeBalanceDecimal;
          let overdraftDetected = false;

          for (const item of dto.transactions) {
            const amount = new Decimal(item.amount);
            const candidateAfter =
              item.direction === 'DEBIT'
                ? simulatedBalance.minus(amount)
                : simulatedBalance.plus(amount);

            if (
              balanceConfig.failurePolicy === FAILURE_POLICY_REJECT_BATCH &&
              !allowNegative &&
              candidateAfter.lt(minBalanceDecimal)
            ) {
              overdraftDetected = true;
              break;
            }

            simulatedBalance = candidateAfter;
          }

          if (overdraftDetected) {
            await this.balanceRepository.createBalanceSnapshot({
              accountId,
              accountType,
              currency,
              requestId: dto.requestId,
              beforeBalance: beforeBalanceDecimal.toString(),
              afterBalance: beforeBalanceDecimal.toString(),
              status: 'REJECTED',
              accountingDate: new Date(),
            });

            return {
              requestId: dto.requestId,
              status: 'REJECTED',
              errorCode: 'INSUFFICIENT_FUNDS',
              account: {
                accountId,
                accountType,
                currency,
                beforeBalance: beforeBalanceDecimal.toFixed(2),
                afterBalance: beforeBalanceDecimal.toFixed(2),
              },
            };
          }

          for (const item of dto.transactions) {
            const amount = new Decimal(item.amount);
            const txBefore = currentBalance;
            const txAfter =
              item.direction === 'DEBIT'
                ? currentBalance.minus(amount)
                : currentBalance.plus(amount);

            currentBalance = txAfter;

            const transactionNo = `TX-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}`;

            await this.balanceRepository.createBalanceTransaction({
              idempotencyKey: dto.idempotencyKey,
              requestId: dto.requestId,
              batchId: dto.requestId,
              accountId,
              accountType,
              currency,
              transactionType: item.transactionType,
              direction: item.direction,
              transactionNo,
              amount: amount.toString(),
              beforeBalance: txBefore.toString(),
              afterBalance: txAfter.toString(),
              oppositeAccount: item.oppositeAccount ?? null,
              oppositeAccountType: item.oppositeAccountType ?? null,
              businessRefNo: item.businessRefNo ?? null,
              status: 'SUCCESS',
              errorCode: null,
              errorMessage: null,
              lockType: 'PESSIMISTIC',
              retryCount: 0,
              conflictDetected: false,
              transactionTime: new Date(),
              accountingDate: new Date(),
              reconciled: false,
              reconciledAt: null,
            });

            transactions.push({
              transactionNo,
              transactionType: item.transactionType,
              direction: item.direction,
              amount: amount.toFixed(2),
              beforeBalance: txBefore.toFixed(2),
              afterBalance: txAfter.toFixed(2),
              businessRefNo: item.businessRefNo ?? null,
              status: 'SUCCESS',
            });
          }

          if (existing) {
            const frozen = existing.frozenBalance
              ? new Decimal(
                  (
                    existing.frozenBalance as { toString: () => string }
                  ).toString(),
                )
              : new Decimal(0);
            await this.balanceRepository.updateAccountBalanceById(existing.id, {
              balance: currentBalance.toString(),
              totalBalance: currentBalance.plus(frozen).toString(),
              updatedAt: new Date(),
            } as never);
          } else {
            const frozen = new Decimal(0);
            await this.balanceRepository.createAccountBalance({
              accountId,
              accountType,
              currency,
              balance: currentBalance.toString(),
              frozenBalance: frozen.toString(),
              totalBalance: currentBalance.plus(frozen).toString(),
              status: 'ACTIVE',
            } as never);
          }

          await this.balanceRepository.createBalanceSnapshot({
            accountId,
            accountType,
            currency,
            requestId: dto.requestId,
            beforeBalance: beforeBalanceDecimal.toString(),
            afterBalance: currentBalance.toString(),
            status: 'SUCCESS',
            accountingDate: new Date(),
          });

          return {
            requestId: dto.requestId,
            status: 'SUCCESS',
            account: {
              accountId,
              accountType,
              currency,
              beforeBalance: beforeBalanceDecimal.toFixed(2),
              afterBalance: currentBalance.toFixed(2),
            },
            transactions,
          };
        }),
    );
  }

  private computeRequestHash(dto: CreateBalanceTransactionsDto) {
    const json = JSON.stringify(dto);
    return createHash('sha256').update(json).digest('hex');
  }

  private async handleWithIdempotency(
    idempotencyKey: string,
    requestHash: string,
    expiredAt: Date,
    handler: () => Promise<unknown>,
  ): Promise<unknown> {
    const existing = await this.idempotencyRepository.findByKeyAndHash({
      idempotencyKey,
      requestHash,
    });

    if (existing && existing.status === 'SUCCESS' && existing.responseData) {
      return existing.responseData;
    }

    let record = existing as { id: number } | null;

    if (!record) {
      const created = await this.idempotencyRepository.create({
        idempotencyKey,
        requestHash,
        status: 'PROCESSING',
        expiredAt,
      } as never);
      record = (created as { id: number } | null) ?? null;
    }

    try {
      const result = await handler();
      if (record && typeof record.id === 'number') {
        await this.idempotencyRepository.updateById(record.id, {
          status: 'SUCCESS',
          responseData: result as never,
        } as never);
      }
      return result;
    } catch (error) {
      if (record && typeof record.id === 'number') {
        await this.idempotencyRepository.updateById(record.id, {
          status: 'FAILED',
          errorInfo: {
            message: (error as Error).message,
          } as never,
        } as never);
      }
      throw error;
    }
  }
}
