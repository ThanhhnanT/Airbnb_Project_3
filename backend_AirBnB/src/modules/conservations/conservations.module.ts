import { Module } from '@nestjs/common';
import { ConservationsService } from './conservations.service';
import { ConservationsController } from './conservations.controller';

@Module({
  controllers: [ConservationsController],
  providers: [ConservationsService],
})
export class ConservationsModule {}
