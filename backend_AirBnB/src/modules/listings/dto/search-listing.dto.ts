import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, Min, IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchListingDto {
  @ApiProperty({ example: 'Ho Chi Minh City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Vietnam', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '2024-12-25', required: false })
  @IsOptional()
  @IsDateString()
  check_in?: string;

  @ApiProperty({ example: '2024-12-30', required: false })
  @IsOptional()
  @IsDateString()
  check_out?: string;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ example: 'price_base', required: false, enum: ['price_base', 'avg_rating', 'createdAt'] })
  @IsOptional()
  @IsString()
  sort_by?: string = 'createdAt';

  @ApiProperty({ example: 'desc', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ example: 10.7769, required: false, description: 'Latitude for location-based search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 106.7009, required: false, description: 'Longitude for location-based search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 10, required: false, description: 'Radius in kilometers for location-based search', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number = 10; // Default 10km

  @ApiProperty({ example: ['WiFi', 'Pool'], required: false, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ example: 2, required: false, description: 'Minimum bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms_min?: number;

  @ApiProperty({ example: 2, required: false, description: 'Minimum beds' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  beds_min?: number;

  @ApiProperty({ example: 1, required: false, description: 'Minimum bathrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms_min?: number;

  @ApiProperty({ example: 'beachfront', required: false, description: 'Keyword search on title/description' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

