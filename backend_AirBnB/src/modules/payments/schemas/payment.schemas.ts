import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String, required: true })
  provider: string;

  @Prop({ type: String })
  provider_payment_id: string;

  @Prop({ type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
