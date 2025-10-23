import { PartialType } from '@nestjs/mapped-types';
import { CreateConservationDto } from './create-conservation.dto';

export class UpdateConservationDto extends PartialType(CreateConservationDto) {}
