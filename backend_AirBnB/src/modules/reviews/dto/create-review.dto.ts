import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty({ message: 'Booking ID không được để trống' })
  @IsMongoId({ message: 'Booking ID không hợp lệ' })
  booking_id: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty({ message: 'Rating không được để trống' })
  @IsInt({ message: 'Rating phải là số nguyên' })
  @Min(1, { message: 'Rating tối thiểu là 1' })
  @Max(5, { message: 'Rating tối đa là 5' })
  rating: number;

  @ApiPropertyOptional({ example: 'Chỗ ở sạch sẽ, chủ nhà thân thiện.' })
  @IsOptional()
  @IsString({ message: 'Comment phải là chuỗi' })
  comment?: string;
}
