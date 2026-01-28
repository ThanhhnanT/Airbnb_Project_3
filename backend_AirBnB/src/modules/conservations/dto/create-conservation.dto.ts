import { IsMongoId } from 'class-validator';

export class CreateConservationDto {
  @IsMongoId()
  booking_id: string;
}
