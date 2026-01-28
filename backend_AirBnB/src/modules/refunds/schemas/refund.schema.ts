import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefundDocument = HydratedDocument<Refund>;

@Schema({ timestamps: true })
export class Refund {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guest_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  payment_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({
    type: String,
    enum: ['guest_request', 'safety_issue', 'not_as_described', 'host_unresponsive', 'other'],
    required: true,
  })
  reason: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'pending_host_confirmation', 'confirmed_by_host', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  admin_id: Types.ObjectId;

  @Prop({ type: String })
  admin_notes: string;

  @Prop({ type: Date })
  requested_at: Date;

  @Prop({ type: Date })
  approved_at: Date;

  @Prop({ type: Date })
  completed_at: Date;

  @Prop({ type: String })
  stripe_refund_id: string;

  @Prop({ type: Date })
  host_confirmed_at: Date;

  @Prop({
    type: String,
    enum: ['pending_host_confirmation', 'confirmed_by_host'],
    default: 'pending_host_confirmation',
  })
  host_confirmation_status: string;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
