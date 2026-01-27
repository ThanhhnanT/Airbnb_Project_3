import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsStatsService } from './listings-stats.service';
import { ListingsController, AdminListingsController } from './listings.controller';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { ListingImage, ListingImageSchema } from '../listing_images/schemas/listing_image.schema';
import { Calendar, CalendarSchema } from '../calendars/schemas/calendar.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';

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
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
    ]),
    NotificationsModule,
  ],
  controllers: [ListingsController, AdminListingsController],
  providers: [ListingsService, ListingsStatsService],
  exports: [ListingsService, ListingsStatsService],
})
export class ListingsModule {}
