import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AccountTripleDto {
  @IsString() accountId!: string;
  @IsString() accountType!: string;
  @IsString() currency!: string;
}

export class BatchBalanceQueryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AccountTripleDto)
  accounts!: AccountTripleDto[];
}
