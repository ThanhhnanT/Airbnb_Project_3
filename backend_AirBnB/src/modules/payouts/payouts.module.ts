import { Module, forwardRef } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { Payout, PayoutSchema } from './schemas/payout.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schemas';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { BankAccount, BankAccountSchema } from '../users/schemas/bank-account.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payout.name,
        schema: PayoutSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
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
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
