import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BalanceService } from './balance.service';
import { CreateBalanceTransactionsDto } from './dto/create-balance-transactions.dto';
import { SnapshotService } from './snapshot.service';
import { TransactionQueryService } from './transaction-query.service';

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

  @Get()
  async getBalance(
    @Query('accountId') accountId?: string,
    @Query('accountType') accountType?: string,
    @Query('currency') currency?: string,
  ): Promise<unknown> {
    if (!accountId || !accountType || !currency) {
      throw new BadRequestException(
        'accountId、accountType、currency 为必填参数',
      );
    }
    const record = (await this.balanceService.getBalance({
      accountId,
      accountType,
      currency,
    })) as
      | {
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
        }
      | null;
    if (!record) {
      throw new NotFoundException('账户不存在');
    }
    const toStr = (v: unknown, d = '0.00') =>
      v && typeof (v as { toString: () => string }).toString === 'function'
        ? (v as { toString: () => string }).toString()
        : (v as string | undefined) ?? d;
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
  }
}
