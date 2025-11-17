import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DisputeDocument = HydratedDocument<Dispute>;

@Schema({ timestamps: true })
export class Dispute {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, enum: ['open', 'resolved', 'rejected'], default: 'open' })
  status: string;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
