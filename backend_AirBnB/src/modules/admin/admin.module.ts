import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schemas';
import { Settings, SettingsSchema } from './schemas/settings.schema';
import { ListingImage, ListingImageSchema } from '../listing_images/schemas/listing_image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Settings.name, schema: SettingsSchema },
      { name: ListingImage.name, schema: ListingImageSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

