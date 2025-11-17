import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsMongoId({ message: 'User ID không hợp lệ' })
  user_id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsNotEmpty({ message: 'Listing ID không được để trống' })
  @IsMongoId({ message: 'Listing ID không hợp lệ' })
  listing_id: string;
}
