import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @IsEnum(['guest_request', 'safety_issue', 'not_as_described', 'host_unresponsive', 'other'])
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ApproveRefundDto {
  @IsString()
  @IsOptional()
  admin_notes: string;
}

export class RejectRefundDto {
  @IsString()
  @IsNotEmpty()
  admin_notes: string;
}
