import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Date, default: Date.now })
  last_updated: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
