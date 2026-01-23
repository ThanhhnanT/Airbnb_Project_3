import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStripeAccountDto {
  @ApiProperty({ description: 'Email của host', example: 'host@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mã quốc gia (ISO 2-letter)', example: 'US' })
  @IsString()
  country: string;

  @ApiProperty({ 
    description: 'Loại tài khoản Stripe Connect', 
    enum: ['express', 'standard'],
    default: 'express'
  })
  @IsEnum(['express', 'standard'])
  @IsOptional()
  type?: 'express' | 'standard';
}

export class UpdateStripeAccountDto {
  @ApiProperty({ description: 'Stripe Connect account ID' })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({ 
    description: 'Trạng thái tài khoản',
    enum: ['unverified', 'pending', 'verified']
  })
  @IsEnum(['unverified', 'pending', 'verified'])
  @IsOptional()
  status?: 'unverified' | 'pending' | 'verified';
}
