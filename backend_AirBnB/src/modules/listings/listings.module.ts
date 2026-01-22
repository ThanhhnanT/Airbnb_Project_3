import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { ListingImage, ListingImageSchema } from '../listing_images/schemas/listing_image.schema';
import { Calendar, CalendarSchema } from '../calendars/schemas/calendar.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Listing.name,
        schema: ListingSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: Review.name,
        schema: ReviewSchema,
      },
      {
        name: ListingImage.name,
        schema: ListingImageSchema,
      },
      {
        name: Calendar.name,
        schema: CalendarSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
