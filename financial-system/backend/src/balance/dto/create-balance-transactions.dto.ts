import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AccountDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  accountType: string;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class BalanceTransactionItemDto {
  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @IsString()
  @IsNotEmpty()
  direction: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  businessRefNo?: string;

  @IsString()
  oppositeAccount?: string;

  @IsString()
  oppositeAccountType?: string;
}

export class CreateBalanceTransactionsDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ValidateNested()
  @Type(() => AccountDto)
  account: AccountDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceTransactionItemDto)
  transactions: BalanceTransactionItemDto[];
}
