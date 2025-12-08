import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ListingImageDocument = HydratedDocument<ListingImage>;

@Schema({ timestamps: true })
export class ListingImage {
  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing_id: Types.ObjectId;

  @Prop({ type: Array, required: true })
  image_url: Array<string>;

  @Prop({ type: Boolean, default: false })
  is_cover: boolean;
}

export const ListingImageSchema = SchemaFactory.createForClass(ListingImage);
