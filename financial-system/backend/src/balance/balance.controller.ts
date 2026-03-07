import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BalanceService } from './balance.service';
import { CreateBalanceTransactionsDto } from './dto/create-balance-transactions.dto';

@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

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
}
