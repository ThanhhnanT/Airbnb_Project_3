import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ type: String, default: 'Airbnb Clone' })
  siteName: string;

  @Prop({ type: String, default: 'Platform đặt phòng trực tuyến' })
  siteDescription: string;

  @Prop({ type: String, default: 'admin@example.com' })
  adminEmail: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
