import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayoutDocument = HydratedDocument<Payout>;

@Schema({ timestamps: true })
export class Payout {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  payment_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number, required: true })
  platform_fee: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'BankAccount' })
  bank_account_id: Types.ObjectId;

  @Prop({ type: String })
  admin_note: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processed_by: Types.ObjectId;

  @Prop({ type: Date })
  processed_at: Date;

  // Keep Stripe fields for backward compatibility (optional)
  @Prop({ type: String })
  provider_payout_id: string;

  @Prop({ type: String })
  stripe_account_id: string;

  @Prop({ 
    type: String, 
    enum: ['transfer', 'payout'], 
    default: 'transfer' 
  })
  transfer_type: string;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);
