import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host_id: Types.ObjectId;

  @Prop({ type: Date, required: true })
  check_in: Date;

  @Prop({ type: Date, required: true })
  check_out: Date;

  @Prop({ type: Number, required: true })
  nights: number;

  @Prop({ type: Number, required: true })
  guests: number;

  @Prop({ type: Number, required: true })
  total_price: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  payment_id: Types.ObjectId;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
