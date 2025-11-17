import { Module } from '@nestjs/common';
import { ConservationsService } from './conservations.service';
import { ConservationsController } from './conservations.controller';
import { Conversation, ConversationSchema } from './schemas/conservation.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
      },
    ]),
  ],
  controllers: [ConservationsController],
  providers: [ConservationsService],
  exports: [ConservationsService],
})
export class ConservationsModule {}
