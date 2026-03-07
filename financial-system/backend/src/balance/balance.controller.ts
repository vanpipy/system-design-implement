import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CreateBalanceTransactionsDto } from './dto/create-balance-transactions.dto';

@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  createTransactions(
    @Body() dto: CreateBalanceTransactionsDto,
  ): ReturnType<BalanceService['applyTransactions']> {
    return this.balanceService.applyTransactions(dto);
  }
}
