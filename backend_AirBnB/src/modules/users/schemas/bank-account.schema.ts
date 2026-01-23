import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BankAccountDocument = HydratedDocument<BankAccount>;

@Schema({ timestamps: true })
export class BankAccount {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  account_number: string;

  @Prop({ type: String, required: true })
  bank_name: string;

  @Prop({ type: String, required: true })
  account_holder_name: string;

  @Prop({ type: Boolean, default: true })
  is_primary: boolean;

  @Prop({ type: Boolean, default: false })
  is_verified: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
