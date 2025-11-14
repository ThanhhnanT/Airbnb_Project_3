import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String, enum: ['guest', 'host', 'admin'], default: 'guest' })
  role: string;

  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  avatar_url: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop() 
  codeId: string
  
  @Prop() 
  codeExpired: string

}

export const UserSchema = SchemaFactory.createForClass(User);
