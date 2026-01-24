import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class BookingsSchedulerService {
  private readonly logger = new Logger(BookingsSchedulerService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkCheckoutNotifications() {
    try {
      this.logger.log('Starting checkout notification check...');

      // Find all confirmed bookings where checkout was exactly 1 day ago (within 1 hour window)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const bookings = await this.bookingModel
        .find({
          status: 'confirmed',
          check_out: {
            $gte: twoDaysAgo,
            $lte: oneDayAgo,
          },
        })
        .populate('host_id', 'name email')
        .populate('listing_id', 'title')
        .populate('guest_id', 'name email')
        .exec();

      this.logger.log(`Found ${bookings.length} bookings to notify for checkout`);

      for (const booking of bookings) {
        try {
          // Check if payment is paid
          const payment = await this.paymentModel.findById(booking.payment_id).exec();
          if (!payment || payment.status !== 'paid') {
            this.logger.log(
              `Skipping booking ${booking._id} - payment not paid`,
            );
            continue;
          }

          // Check if notification already exists for this booking
          const existingNotification = await this.findCheckoutNotificationForBooking(
            booking.host_id.toString(),
            booking._id.toString(),
          );

          if (existingNotification) {
            this.logger.log(
              `Notification already exists for booking ${booking._id}`,
            );
            continue;
          }

          // Create notification for host
          const hostName = (booking.host_id as any).name || 'Chủ nhà';
          const guestName = (booking.guest_id as any).name || 'Khách';
          const listingTitle = (booking.listing_id as any).title || 'Phòng cho thuê';

          await this.notificationsService.createCheckoutNotification(
            booking.host_id.toString(),
            booking._id.toString(),
            guestName,
            listingTitle,
          );

          // Emit notification via WebSocket
          this.notificationsGateway.sendToHost(booking.host_id.toString(), 'checkout_completed', {
            booking_id: booking._id.toString(),
            guest_name: guestName,
            listing_title: listingTitle,
            message: `Chúc mừng! Chuyến đi của khách ${guestName} tại "${listingTitle}" đã hoàn thành. Vui lòng để lại đánh giá cho khách hàng.`,
            link_action: `/reviews/write/${booking._id.toString()}`,
          });

          this.logger.log(
            `Created checkout notification for host ${hostName} for booking ${booking._id}`,
          );
        } catch (error) {
          this.logger.error(
            `Error processing booking ${booking._id}:`,
            error,
          );
        }
      }

      this.logger.log('Checkout notification check completed');
    } catch (error) {
      this.logger.error('Error in checkout notification check:', error);
    }
  }

  private async findCheckoutNotificationForBooking(
    hostId: string,
    bookingId: string,
  ) {
    return await this.notificationsService.findCheckoutNotificationForBooking(hostId, bookingId);
  }
}
