import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

const RoleSchema = new MongooseSchema({
  type: {
    type: String,
    enum: ['guest', 'host', 'admin'],
    default: 'guest'
  },
  listID: {
    type: [String],
    default: undefined // Chỉ có khi type = 'host', được quản lý trong service
  }
}, { _id: false });

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

  @Prop({ 
    type: RoleSchema, 
    default: () => ({ type: 'guest' })
  })
  role: {
    type: 'guest' | 'host' | 'admin';
    listID?: string[]; // Chỉ có khi type = 'host'
  };

  @Prop({ type: String })
  bio: string;

  @Prop({ type: String })
  avatar_url: string;

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: Boolean, default: false })
  phone_verified: boolean;

  @Prop({ type: Boolean, default: false })
  id_verified: boolean;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop() 
  codeId: string;
  
  @Prop() 
  codeExpired: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
