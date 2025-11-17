import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ListingDocument = HydratedDocument<Listing>;

@Schema({ timestamps: true })
export class Listing {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  host_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  street: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String })
  postal_code: string;

  @Prop({ type: Number })
  latitude: number;

  @Prop({ type: Number })
  longitude: number;

  @Prop({ type: Number, required: true })
  price_base: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: Number, default: 0 })
  cleaning_fee: number;

  @Prop({ type: Number, default: 0 })
  extra_guest_fee: number;

  @Prop({ type: Number, required: true })
  guests: number;

  @Prop({ type: Number })
  bedrooms: number;

  @Prop({ type: Number })
  beds: number;

  @Prop({ type: Number })
  bathrooms: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: String })
  house_rules: string;

  @Prop({ type: String, enum: ['flexible', 'moderate', 'strict'], default: 'moderate' })
  cancellation_policy: string;

  @Prop({ type: Number, default: 0 })
  avg_rating: number;

  @Prop({ type: Number, default: 0 })
  review_count: number;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
