import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createBookingDto: CreateBookingDto, guestId: string): Promise<Booking> {
    try {
      const { listing_id, check_in, check_out, guests } = createBookingDto;

      if (!listing_id || !check_in || !check_out || !guests) {
        throw new BadRequestException('Thiếu thông tin đặt phòng');
      }

      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);

      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new BadRequestException('Định dạng ngày không hợp lệ');
      }

      if (checkInDate >= checkOutDate) {
        throw new BadRequestException('Ngày check-out phải sau ngày check-in');
      }

      const listingObjectId = new Types.ObjectId(listing_id);

      const listing = await this.listingModel.findById(listingObjectId).exec();
      if (!listing) {
        throw new NotFoundException(`Listing với ID ${listing_id} không tồn tại`);
      }

      // Ensure host_id exists and is valid
      if (!listing.host_id) {
        throw new BadRequestException('Listing không có thông tin chủ nhà');
      }

      // Check if user already has a booking during this time period at another location
      const guestObjectId = new Types.ObjectId(guestId);
      const pendingExpiry = new Date(Date.now() - 5 * 60 * 1000);
      
      console.log('[BookingsService] create - Checking user bookings overlap:', {
        guestId: guestId,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        listingId: listing_id,
      });
      
      // Find all bookings of this user that overlap with the requested dates
      // Check ALL bookings of user (including same listing) to prevent double booking
      // Include all active statuses: pending, confirmed, completed (if dates still overlap)
      const userOverlappingBookings = await this.bookingModel
        .find({
          guest_id: guestObjectId,
          status: { $in: ['pending', 'confirmed', 'completed'] },
          // Overlap condition: booking.check_in <= new_check_out AND booking.check_out >= new_check_in
          check_in: { $lte: checkOutDate },
          check_out: { $gte: checkInDate },
        })
        .populate('listing_id', 'title city country address')
        .exec();
      
      // Separate bookings by listing (same vs different)
      const sameListingBookings = userOverlappingBookings.filter(
        (b) => (b.listing_id as any)?._id?.toString() === listingObjectId.toString()
      );
      const otherListingBookings = userOverlappingBookings.filter(
        (b) => (b.listing_id as any)?._id?.toString() !== listingObjectId.toString()
      );

      console.log('[BookingsService] create - Found overlapping bookings:', userOverlappingBookings.length);
      userOverlappingBookings.forEach((b, idx) => {
        console.log(`[BookingsService] create - Overlapping booking ${idx + 1}:`, {
          _id: b._id.toString(),
          listing_id: (b.listing_id as any)?._id?.toString(),
          listing_title: (b.listing_id as any)?.title,
          check_in: b.check_in.toISOString(),
          check_out: b.check_out.toISOString(),
          status: b.status,
          createdAt: (b as any).createdAt?.toISOString(),
        });
      });

      // Filter out pending bookings older than 5 minutes
      const filterValidBookings = (bookings: any[]) => {
        return bookings.filter((b) => {
          if (b.status === 'confirmed' || b.status === 'completed') return true;
          if (b.status === 'pending') {
            const createdAt = (b as any).createdAt;
            const isValid = createdAt && createdAt >= pendingExpiry;
            console.log(`[BookingsService] create - Pending booking ${b._id}:`, {
              createdAt: createdAt?.toISOString(),
              pendingExpiry: pendingExpiry.toISOString(),
              isValid,
            });
            return isValid;
          }
          return false;
        });
      };

      const validOtherListingBookings = filterValidBookings(otherListingBookings);
      const validSameListingBookings = filterValidBookings(sameListingBookings);

      console.log('[BookingsService] create - Valid other listing bookings:', validOtherListingBookings.length);
      console.log('[BookingsService] create - Valid same listing bookings:', validSameListingBookings.length);

      // Format dates helper function
      const formatDate = (date: Date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Priority 1: If user has booking at ANOTHER location during this time, throw error with details
      if (validOtherListingBookings.length > 0) {
        const otherListingBooking = validOtherListingBookings[0];
        const listingInfo = otherListingBooking.listing_id as any;
        
        const conflictCheckIn = formatDate(otherListingBooking.check_in);
        const conflictCheckOut = formatDate(otherListingBooking.check_out);
        const location = listingInfo?.address || `${listingInfo?.city || ''}, ${listingInfo?.country || ''}`.trim();
        const listingTitle = listingInfo?.title || 'địa điểm khác';
        
        throw new BadRequestException(
          `Bạn đã có đặt phòng trong khoảng thời gian này tại ${location} (${listingTitle}). ` +
          `Thời gian: ${conflictCheckIn} - ${conflictCheckOut}. ` +
          `Vui lòng chọn khoảng thời gian khác hoặc hủy đặt phòng hiện tại.`
        );
      }

      // Priority 2: Check if user already has booking at SAME listing
      // If user has pending booking at same listing (within 5 min), allow reuse
      const recentPendingSameListing = validSameListingBookings.filter(
        (b) => b.status === 'pending'
      );
      const pendingForSameUser = recentPendingSameListing.find(
        (b) => b.guest_id.toString() === guestId,
      );
      if (pendingForSameUser) {
        console.log('[BookingsService] create - Reusing existing pending booking for same user');
        return pendingForSameUser;
      }

      // If user has confirmed/completed booking at same listing, throw error
      const confirmedSameListing = validSameListingBookings.find(
        (b) => b.status === 'confirmed' || b.status === 'completed'
      );
      if (confirmedSameListing) {
        throw new BadRequestException('Bạn đã có đặt phòng tại phòng này trong khoảng thời gian này. Vui lòng chọn khoảng thời gian khác.');
      }

      // Priority 3: Check listing availability (for other users' bookings)
      // Lấy tất cả booking trùng khoảng thời gian của listing này (của tất cả users)
      const overlappingBookings = await this.bookingModel.find({
        listing_id: listingObjectId,
        status: { $in: ['pending', 'confirmed'] },
        check_in: { $lte: checkOutDate },
        check_out: { $gte: checkInDate },
      }).exec();

      // Nếu có booking confirmed trùng ngày => luôn chặn
      const confirmedConflict = overlappingBookings.find(
        (b) => b.status === 'confirmed',
      );
      if (confirmedConflict) {
        throw new BadRequestException('Khoảng thời gian này đã được đặt');
      }

      // Booking pending trong 5 phút gần nhất (của user khác)
      const recentPending = overlappingBookings.filter(
        (b) =>
          b.status === 'pending' &&
          b.guest_id.toString() !== guestId && // Exclude current user (already handled above)
          (b as any).createdAt &&
          (b as any).createdAt >= pendingExpiry,
      );

      // Nếu có booking pending của user khác trong 5 phút gần nhất => chặn
      if (recentPending.length > 0) {
        throw new BadRequestException('Khoảng thời gian này đã được đặt hoặc đang chờ thanh toán');
      }

      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (nights <= 0) {
        throw new BadRequestException('Số đêm lưu trú không hợp lệ');
      }

      // Tính tổng giá đơn giản, tương đồng với logic tìm kiếm
      let totalPrice = listing.price_base * nights;
      totalPrice += listing.cleaning_fee || 0;

      if (guests && listing.guests && guests > listing.guests) {
        const extraGuests = guests - listing.guests;
        totalPrice += (listing.extra_guest_fee || 0) * extraGuests;
      }

      // Ensure host_id is ObjectId (handle both populated and non-populated cases)
      let hostIdObjectId: Types.ObjectId;
      if (listing.host_id instanceof Types.ObjectId) {
        hostIdObjectId = listing.host_id;
      } else if (typeof listing.host_id === 'string') {
        hostIdObjectId = new Types.ObjectId(listing.host_id);
      } else if ((listing.host_id as any)?._id) {
        // If populated, get the _id
        hostIdObjectId = new Types.ObjectId((listing.host_id as any)._id);
      } else {
        throw new BadRequestException('Listing không có thông tin chủ nhà hợp lệ');
      }

      const createdBooking = new this.bookingModel({
        listing_id: listingObjectId,
        guest_id: new Types.ObjectId(guestId),
        host_id: hostIdObjectId,
        check_in: checkInDate,
        check_out: checkOutDate,
        nights,
        guests,
        total_price: totalPrice,
        currency: listing.currency || 'USD',
        status: 'pending',
      });

      const savedBooking = await createdBooking.save();

      // Send notification to admin about new booking
      try {
        const guest = await this.userModel.findById(guestId).exec();
        this.notificationsGateway.sendToAdmin('booking_new', {
          booking_id: savedBooking._id.toString(),
          guest_id: guestId,
          guest_name: guest?.name || 'Guest',
          listing_id: listing_id,
          listing_title: listing.title,
          check_in: checkInDate.toISOString(),
          check_out: checkOutDate.toISOString(),
          total_price: totalPrice,
          currency: listing.currency || 'USD',
          message: `Có đặt phòng mới từ ${guest?.name || 'Guest'}`,
        });
      } catch (notifError) {
        console.error('Error sending booking notification to admin:', notifError);
        // Don't throw - booking created successfully
      }

      return savedBooking;
    } catch (error) {
      console.error('[BookingsService] create - Error:', error);
      // If it's already a known exception, re-throw it
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      // Otherwise, wrap it
      throw new InternalServerErrorException(
        error?.message || `Error creating booking: ${JSON.stringify(error)}`
      );
    }
  }

  async findAll(userId?: string, role?: 'guest' | 'host'): Promise<Booking[]> {
    try {
      const filter: any = {};
      if (userId && role) {
        filter[role === 'guest' ? 'guest_id' : 'host_id'] = userId;
      }
      return await this.bookingModel.find(filter).populate('listing_id guest_id host_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding bookings: ${error.message}`);
    }
  }

  async findGuestBookings(guestId: string, status?: string): Promise<Booking[]> {
    try {
      console.log('[BookingsService] findGuestBookings - guestId:', guestId, 'type:', typeof guestId);
      console.log('[BookingsService] findGuestBookings - status:', status);
      
      if (!guestId) {
        console.error('[BookingsService] findGuestBookings - ERROR: guestId is empty');
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }

      // Ensure guestId is a string for comparison
      const guestIdString = typeof guestId === 'string' ? guestId : String(guestId);
      // Convert guestId to ObjectId for query
      const guestObjectId = Types.ObjectId.isValid(guestIdString) 
        ? new Types.ObjectId(guestIdString) 
        : new Types.ObjectId(guestIdString);
      console.log('[BookingsService] findGuestBookings - guestObjectId:', guestObjectId.toString());
      console.log('[BookingsService] findGuestBookings - guestIdString:', guestIdString);

      // Query payments with status = "paid" and user_id = guestId
      // Since user_id in database is stored as string, try both string and ObjectId formats
      const paymentFilter: any = {
        $or: [
          { user_id: guestIdString },
          { user_id: guestObjectId },
        ],
        status: 'paid',
      };
      
      console.log('[BookingsService] findGuestBookings - payment filter:', JSON.stringify(paymentFilter, null, 2));
      console.log('[BookingsService] findGuestBookings - guestIdString:', guestIdString);
      console.log('[BookingsService] findGuestBookings - guestObjectId:', guestObjectId.toString());
      
      // Find all paid payments for this user
      let payments = await this.paymentModel
        .find(paymentFilter)
        .populate({
          path: 'booking_id',
          populate: [
            {
              path: 'listing_id',
              select: 'title images city country address',
            },
            {
              path: 'host_id',
              select: 'name email',
            },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();
      
      console.log('[BookingsService] findGuestBookings - found payments count:', payments.length);
      
      // If still no results, try fetching all and filtering manually
      if (payments.length === 0) {
        console.log('[BookingsService] findGuestBookings - Trying manual filter...');
        const allPaidPayments = await this.paymentModel
          .find({ status: 'paid' })
          .populate({
            path: 'booking_id',
            populate: [
              {
                path: 'listing_id',
                select: 'title images city country address',
              },
              {
                path: 'host_id',
                select: 'name email',
              },
            ],
          })
          .sort({ createdAt: -1 })
          .exec();
        
        // Filter manually by comparing string representations
        payments = allPaidPayments.filter((p: any) => {
          const paymentUserId = p.user_id?.toString();
          return paymentUserId === guestIdString || paymentUserId === guestObjectId.toString();
        });
        
        console.log('[BookingsService] findGuestBookings - found payments after manual filter:', payments.length);
        if (allPaidPayments.length > 0) {
          console.log('[BookingsService] findGuestBookings - DEBUG: sample paid payments:', allPaidPayments.slice(0, 3).map((p: any) => ({
            _id: p._id.toString(),
            user_id: p.user_id?.toString(),
            user_id_raw: p.user_id,
            user_id_type: typeof p.user_id,
            booking_id: p.booking_id ? (p.booking_id as any)._id?.toString() : null,
            status: p.status,
            matches: p.user_id?.toString() === guestIdString || p.user_id?.toString() === guestObjectId.toString(),
          })));
        }
      }
      
      if (payments.length > 0) {
        console.log('[BookingsService] findGuestBookings - first payment:', {
          _id: payments[0]._id.toString(),
          user_id: (payments[0] as any).user_id?.toString(),
          booking_id: payments[0].booking_id ? (payments[0].booking_id as any)._id?.toString() : null,
          status: payments[0].status,
        });
      }
      
      // Extract bookings from payments
      const bookings: any[] = [];
      for (const payment of payments) {
        if (payment.booking_id) {
          const booking = payment.booking_id as any;
          
          // Convert booking to plain object if it's a Document
          const bookingObj = booking.toObject ? booking.toObject() : booking;
          
          // Add payment info to booking
          const bookingWithPayment: any = {
            ...bookingObj,
            payment_id: {
              _id: payment._id.toString(),
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
            },
          };
          
          // Filter by booking status if provided
          if (status) {
            if (status === 'completed') {
              const checkOutTime = new Date(bookingWithPayment.check_out).getTime();
              const isAfterCheckout = !isNaN(checkOutTime) && Date.now() > checkOutTime;
              const isCompleted =
                bookingWithPayment.status === 'completed' ||
                (bookingWithPayment.status === 'confirmed' && isAfterCheckout);
              if (isCompleted) {
                // Do not mutate DB; only normalize for UI
                bookingWithPayment.status = 'completed';
                bookings.push(bookingWithPayment);
              }
            } else if (bookingWithPayment.status === status) {
              bookings.push(bookingWithPayment);
            }
          } else {
            bookings.push(bookingWithPayment);
          }
        }
      }
      
      // Sort by check_in date (descending)
      bookings.sort((a, b) => {
        const dateA = new Date(a.check_in).getTime();
        const dateB = new Date(b.check_in).getTime();
        return dateB - dateA;
      });
      
      console.log('[BookingsService] findGuestBookings - final bookings count:', bookings.length);
      if (bookings.length > 0) {
        const firstBooking = bookings[0] as any;
        console.log('[BookingsService] findGuestBookings - first booking:', {
          _id: firstBooking._id,
          guest_id: firstBooking.guest_id?.toString(),
          check_in: firstBooking.check_in,
          check_out: firstBooking.check_out,
          status: firstBooking.status,
          payment_status: firstBooking.payment_id?.status,
        });
      }
      
      return bookings as any;
    } catch (error) {
      console.error('[BookingsService] findGuestBookings - ERROR:', error.message);
      console.error('[BookingsService] findGuestBookings - ERROR stack:', error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding guest bookings: ${error.message}`);
    }
  }

  async findHostBookings(hostId: string, status?: string): Promise<Booking[]> {
    try {
      const filter: any = { host_id: hostId };
      if (status) {
        filter.status = status;
      }
      return await this.bookingModel
        .find(filter)
        .populate('listing_id guest_id')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding host bookings: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Booking> {
    try {
      const booking = await this.bookingModel.findById(id).populate('listing_id guest_id host_id').exec();
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }
      return booking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding booking: ${error.message}`);
    }
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    try {
      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(id, updateBookingDto, { new: true })
        .exec();
      if (!updatedBooking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }
      return updatedBooking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating booking: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.bookingModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting booking: ${error.message}`);
    }
  }

  /**
   * Đánh dấu các booking pending quá hạn là cancelled để giải phóng lịch
   * (ví dụ có thể được gọi bởi một cron job hoặc endpoint quản trị).
   */
  async cancelExpiredPendingBookings(expiredBefore: Date): Promise<number> {
    try {
      const result = await this.bookingModel.updateMany(
        {
          status: 'pending',
          createdAt: { $lt: expiredBefore },
        } as any,
        { $set: { status: 'cancelled' } },
      ).exec();

      return result.modifiedCount || 0;
    } catch (error) {
      throw new InternalServerErrorException(`Error cancelling pending bookings: ${error.message}`);
    }
  }

  async countBookingsByListingForHost(hostId: string): Promise<{ listingId: string; count: number }[]> {
    try {
      const result = await this.bookingModel.aggregate([
        {
          $match: {
            host_id: new Types.ObjectId(hostId),
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: '$listing_id',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            listingId: { $toString: '$_id' },
            count: 1,
            _id: 0,
          },
        },
      ]).exec();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Error counting bookings by listing: ${error.message}`);
    }
  }

  async getBookingStatsForHost(hostId: string): Promise<{ listingId: string; totalRevenue: number; count: number }[]> {
    try {
      const hostObjectId = new Types.ObjectId(hostId);
      
      const result = await this.bookingModel.aggregate([
        {
          $match: {
            host_id: hostObjectId,
            status: 'confirmed',
          },
        },
        {
          $group: {
            _id: '$listing_id',
            totalRevenue: { $sum: '$total_price' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            listingId: { $toString: '$_id' },
            totalRevenue: 1,
            count: 1,
            _id: 0,
          },
        },
      ]).exec();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Error getting booking stats by listing: ${error.message}`);
    }
  }
}
