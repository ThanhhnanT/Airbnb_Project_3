import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schemas';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: Listing.name,
        schema: ListingSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
