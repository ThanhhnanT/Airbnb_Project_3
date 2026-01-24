import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Boolean, default: false })
  is_read: boolean;

  @Prop({ type: String, nullable: true })
  link_action?: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking', nullable: true })
  booking_id?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
