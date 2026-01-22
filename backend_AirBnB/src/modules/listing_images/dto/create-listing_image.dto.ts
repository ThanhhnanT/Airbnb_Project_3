import { IsString, IsArray, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingImageDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsString()
  listing_id: string;

  @ApiProperty({ description: 'Array of image URLs', type: [String], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 image is required' })
  @IsString({ each: true })
  image_url: string[];

  @ApiProperty({ description: 'Is cover image', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_cover?: boolean;
}
