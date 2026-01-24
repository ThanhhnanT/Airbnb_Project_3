import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing_id: Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Prevent duplicate favorite per listing per user
FavoriteSchema.index({ user_id: 1, listing_id: 1 }, { unique: true });
