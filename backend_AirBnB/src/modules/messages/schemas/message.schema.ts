import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: [String], default: [] })
  image_urls: string[];

  @Prop({ type: String })
  client_temp_id?: string;

  @Prop({ type: Date, default: Date.now })
  sent_at: Date;

  @Prop({ type: Boolean, default: false })
  is_read: boolean;

  @Prop({ type: Date })
  read_at?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
