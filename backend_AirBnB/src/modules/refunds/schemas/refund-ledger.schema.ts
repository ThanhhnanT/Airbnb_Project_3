import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefundLedgerDocument = HydratedDocument<RefundLedger>;

@Schema({ timestamps: true })
export class RefundLedger {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Refund', required: true })
  refund_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: Date })
  confirmed_date: Date;

  @Prop({ type: String, default: 'refund' })
  type: string;

  @Prop({ type: String, enum: ['pending', 'confirmed'], default: 'pending' })
  status: string;
}

export const RefundLedgerSchema = SchemaFactory.createForClass(RefundLedger);
