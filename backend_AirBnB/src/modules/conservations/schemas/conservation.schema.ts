import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true, unique: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  guest_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  host_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Listing' })
  listing_id?: Types.ObjectId;

  @Prop({ type: String, default: '' })
  last_message_preview?: string;

  @Prop({ type: Date })
  last_message_at?: Date;

  @Prop({ type: Date, default: Date.now })
  last_updated: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
