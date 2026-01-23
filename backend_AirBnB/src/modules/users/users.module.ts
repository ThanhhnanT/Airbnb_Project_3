import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: BankAccount.name,
        schema: BankAccountSchema,
      },
    ]),
    ConfigModule,
  ],
  controllers: [UsersController, BankAccountController],
  providers: [UsersService, BankAccountService],
  exports: [UsersService, BankAccountService],
})
export class UsersModule {}
