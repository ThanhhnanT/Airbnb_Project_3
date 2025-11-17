import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalendarDocument = HydratedDocument<Calendar>;

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing_id: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, enum: ['available', 'booked', 'blocked'], default: 'available' })
  status: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking_id: Types.ObjectId;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
