import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Refund, RefundSchema } from './schemas/refund.schema';
import { RefundLedger, RefundLedgerSchema } from './schemas/refund-ledger.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schemas';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Refund.name, schema: RefundSchema },
      { name: RefundLedger.name, schema: RefundLedgerSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    forwardRef(() => BookingsModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
