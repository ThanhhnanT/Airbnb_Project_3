import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'https://cloudinary.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiProperty({ example: 'User bio description', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}
