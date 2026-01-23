import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Số tài khoản ngân hàng' })
  @IsString()
  account_number: string;

  @ApiProperty({ description: 'Tên ngân hàng' })
  @IsString()
  bank_name: string;

  @ApiProperty({ description: 'Tên chủ tài khoản' })
  @IsString()
  account_holder_name: string;

  @ApiProperty({ description: 'Tài khoản chính', default: true })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}

export class UpdateBankAccountDto {
  @ApiProperty({ description: 'Số tài khoản ngân hàng' })
  @IsString()
  @IsOptional()
  account_number?: string;

  @ApiProperty({ description: 'Tên ngân hàng' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiProperty({ description: 'Tên chủ tài khoản' })
  @IsString()
  @IsOptional()
  account_holder_name?: string;

  @ApiProperty({ description: 'Tài khoản chính' })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
