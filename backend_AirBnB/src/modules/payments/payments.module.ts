import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentSchema } from './schemas/payment.schemas';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PayoutsModule } from '../payouts/payouts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
    ]),
    forwardRef(() => PayoutsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
