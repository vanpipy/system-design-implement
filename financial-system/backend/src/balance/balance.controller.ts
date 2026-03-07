import {
  Body,
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
}
