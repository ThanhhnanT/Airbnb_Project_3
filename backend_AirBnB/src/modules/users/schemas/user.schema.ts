
import { Proppatch } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  email: string;

  @Prop()
  phone: String;

  @Prop()
  password: string;
  
  @Prop()
  username: string;

  @Prop()
  age: number;

  @Prop()
  codeId: string
  @Prop()
  isActive: boolean
  @Prop()
  codeExpired: string 
}

export const UserSchema = SchemaFactory.createForClass(User);
