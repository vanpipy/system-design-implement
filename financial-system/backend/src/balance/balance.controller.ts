import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BalanceService } from './balance.service';
import { CreateBalanceTransactionsDto } from './dto/create-balance-transactions.dto';
import { SnapshotService } from './snapshot.service';
import { TransactionQueryService } from './transaction-query.service';
import { BatchBalanceQueryDto } from './dto/batch-balance-query.dto';

@Controller('balances')
export class BalanceController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly snapshotService: SnapshotService,
    private readonly transactionQueryService: TransactionQueryService,
  ) {}

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  async createTransactions(
    @Body() dto: CreateBalanceTransactionsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const result = (await this.balanceService.applyTransactions(dto)) as {
      status?: string;
    } | null;

    if (result && result.status === 'REJECTED') {
      res.status(HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  @Get('snapshots')
  async getSnapshots(
    @Query('requestId') requestId?: string,
    @Query('accountId') accountId?: string,
    @Query('accountType') accountType?: string,
    @Query('currency') currency?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{ items: unknown[] }> {
    if (!requestId) {
      const hasAccountTriple = !!(accountId && accountType && currency);
      if (!hasAccountTriple) {
        throw new BadRequestException(
          'requestId 或 accountId/accountType/currency 必须提供其一',
        );
      }
    }
    const items = await this.snapshotService.querySnapshots({
      requestId,
      accountId,
      accountType,
      currency,
      from,
      to,
    });

    return { items };
  }

  @Get('transactions')
  async getTransactions(
    @Query('accountId') accountId: string,
    @Query('accountType') accountType: string,
    @Query('currency') currency: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('businessRefNo') businessRefNo?: string,
  ): Promise<{ items: unknown[] }> {
    if (!accountId || !accountType || !currency) {
      throw new BadRequestException(
        'accountId、accountType、currency 为必填参数',
      );
    }
    const items = await this.transactionQueryService.queryTransactions({
      accountId,
      accountType,
      currency,
      from,
      to,
      businessRefNo,
    });

    return { items };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async getBalancesBatch(
    @Body() body: BatchBalanceQueryDto,
  ): Promise<{ items: unknown[] }> {
    if (!body || !Array.isArray((body as { accounts?: unknown[] }).accounts)) {
      throw new BadRequestException('accounts 为必填且需为非空数组');
    }
    if (body.accounts.length === 0) {
      throw new BadRequestException('accounts 为必填且需为非空数组');
    }
    for (const a of body.accounts) {
      if (!a.accountId || !a.accountType || !a.currency) {
        throw new BadRequestException(
          'accounts[*] 的 accountId、accountType、currency 为必填参数',
        );
      }
    }
    const results = await Promise.all(
      body.accounts.map(
        (a) =>
          this.balanceService.getBalance({
            accountId: a.accountId,
            accountType: a.accountType,
            currency: a.currency,
          }) as Promise<{
            accountId: string;
            accountType: string;
            currency: string;
            balance: { toString: () => string } | string;
            frozenBalance?: { toString: () => string } | string;
            minBalance?: { toString: () => string } | string;
            totalBalance?: { toString: () => string } | string;
            status?: string;
            allowNegative?: boolean;
            updatedAt?: Date;
          } | null>,
      ),
    );
    const toStr = (v: unknown, d = '0.00') =>
      v && typeof (v as { toString: () => string }).toString === 'function'
        ? (v as { toString: () => string }).toString()
        : ((v as string | undefined) ?? d);
    const items = results.map((record, idx) => {
      const id = body.accounts[idx];
      if (!record) {
        return {
          accountId: id.accountId,
          accountType: id.accountType,
          currency: id.currency,
          status: 'NOT_FOUND',
        };
      }
      return {
        accountId: record.accountId,
        accountType: record.accountType,
        currency: record.currency,
        balance: toStr(record.balance),
        frozenBalance: toStr(record.frozenBalance),
        totalBalance: toStr(record.totalBalance, toStr(record.balance)),
        minBalance: toStr(record.minBalance),
        status: record.status ?? 'ACTIVE',
        allowNegative: record.allowNegative ?? false,
        updatedAt: record.updatedAt?.toISOString?.() ?? undefined,
      };
    });
    return { items };
  }
}
