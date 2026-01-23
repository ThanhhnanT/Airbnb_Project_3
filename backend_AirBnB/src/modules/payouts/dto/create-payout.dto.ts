import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayoutDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  booking_id: string;

  @ApiProperty({ description: 'Payment ID' })
  @IsString()
  payment_id: string;

  @ApiProperty({ description: 'Host ID' })
  @IsString()
  host_id: string;

  @ApiProperty({ description: 'Payout amount (after platform fee)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Platform fee amount' })
  @IsNumber()
  platform_fee: number;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Bank Account ID' })
  @IsString()
  @IsOptional()
  bank_account_id?: string;

  // Keep Stripe fields for backward compatibility (optional)
  @ApiProperty({ description: 'Stripe account ID (deprecated)' })
  @IsString()
  @IsOptional()
  stripe_account_id?: string;

  @ApiProperty({ 
    description: 'Transfer type (deprecated)',
    enum: ['transfer', 'payout'],
    default: 'transfer'
  })
  @IsString()
  @IsOptional()
  transfer_type?: 'transfer' | 'payout';
}
