import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({ description: 'Host ID' })
  @IsString()
  host_id: string;

  @ApiProperty({ description: 'Listing title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Listing description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Street address', required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Postal code', required: false })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiProperty({ description: 'Base price per night' })
  @IsNumber()
  @Type(() => Number)
  price_base: number;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Cleaning fee', required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  cleaning_fee?: number;

  @ApiProperty({ description: 'Extra guest fee', required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  extra_guest_fee?: number;

  @ApiProperty({ description: 'Maximum number of guests' })
  @IsNumber()
  @Type(() => Number)
  guests: number;

  @ApiProperty({ description: 'Number of bedrooms', required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  bedrooms?: number;

  @ApiProperty({ description: 'Number of beds', required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  beds?: number;

  @ApiProperty({ description: 'Number of bathrooms', required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  bathrooms?: number;

  @ApiProperty({ description: 'Amenities list', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ description: 'House rules', required: false })
  @IsString()
  @IsOptional()
  house_rules?: string;

  @ApiProperty({ description: 'Cancellation policy', enum: ['flexible', 'moderate', 'strict'], default: 'moderate' })
  @IsEnum(['flexible', 'moderate', 'strict'])
  @IsOptional()
  cancellation_policy?: string;
}
