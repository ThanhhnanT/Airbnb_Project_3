import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
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

      // Chỉ giữ chỗ tạm thời cho booking pending trong 5 phút gần nhất
      const pendingExpiry = new Date(Date.now() - 5 * 60 * 1000);

      // Lấy tất cả booking trùng khoảng thời gian (pending + confirmed)
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

      // Booking pending trong 5 phút gần nhất
      const recentPending = overlappingBookings.filter(
        (b) =>
          b.status === 'pending' &&
          (b as any).createdAt &&
          (b as any).createdAt >= pendingExpiry,
      );

      // Nếu đã có booking pending của **chính user này** trong 5 phút gần nhất,
      // cho phép dùng lại booking đó để tiếp tục thanh toán.
      const pendingForSameUser = recentPending.find(
        (b) => b.guest_id.toString() === guestId,
      );
      if (pendingForSameUser) {
        return pendingForSameUser;
      }

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

      const createdBooking = new this.bookingModel({
        listing_id: listingObjectId,
        guest_id: new Types.ObjectId(guestId),
        host_id: listing.host_id,
        check_in: checkInDate,
        check_out: checkOutDate,
        nights,
        guests,
        total_price: totalPrice,
        currency: listing.currency || 'USD',
        status: 'pending',
      });

      return await createdBooking.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating booking: ${error.message}`);
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
}
