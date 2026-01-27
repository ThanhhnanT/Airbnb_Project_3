import { IsArray, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  conversation_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsString()
  client_temp_id?: string;
}
