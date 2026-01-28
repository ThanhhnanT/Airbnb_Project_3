import { Module } from '@nestjs/common';
import { ConservationsService } from './conservations.service';
import { ConservationsController } from './conservations.controller';
import { Conversation, ConversationSchema } from './schemas/conservation.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
    ]),
  ],
  controllers: [ConservationsController],
  providers: [ConservationsService],
  exports: [ConservationsService],
})
export class ConservationsModule {}
