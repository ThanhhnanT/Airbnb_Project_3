import { Injectable } from '@nestjs/common';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';

@Injectable()
export class ConservationsService {
  create(createConservationDto: CreateConservationDto) {
    return 'This action adds a new conservation';
  }

  findAll() {
    return `This action returns all conservations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conservation`;
  }

  update(id: number, updateConservationDto: UpdateConservationDto) {
    return `This action updates a #${id} conservation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conservation`;
  }
}
