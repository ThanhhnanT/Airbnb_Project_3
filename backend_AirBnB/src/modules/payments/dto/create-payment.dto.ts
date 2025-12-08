import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  booking_id: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Payment provider', default: 'stripe' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ description: 'Provider payment ID' })
  @IsString()
  @IsOptional()
  provider_payment_id?: string;

  @ApiProperty({ description: 'Payment status', default: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Payment method ID from Stripe' })
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Booking details' })
  @IsObject()
  bookingDetails: {
    bookingId: string;
    listingId: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    totalPrice: number;
  };
}
