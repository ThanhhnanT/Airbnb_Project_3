import { Injectable, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { ListingImage, ListingImageDocument } from '../listing_images/schemas/listing_image.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    @InjectModel(ListingImage.name) private listingImageModel: Model<ListingImageDocument>,
  ) {}

  async verifyAdmin(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role?.type !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
    }
    return true;
  }

  async getDashboard(userId: string) {
    await this.verifyAdmin(userId);

    try {
      const [
        totalUsers,
        totalListings,
        totalBookings,
        totalRevenue,
        activeListings,
        pendingBookings,
        recentBookings,
        totalGuests,
        totalHosts,
        totalAdmins,
        activeUsers,
        recentUsers,
      ] = await Promise.all([
        this.userModel.countDocuments().exec(),
        this.listingModel.countDocuments().exec(),
        this.bookingModel.countDocuments().exec(),
        this.paymentModel.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).exec(),
        this.listingModel.countDocuments({ status: 'active' }).exec(),
        this.bookingModel.countDocuments({ status: 'pending' }).exec(),
        this.bookingModel
          .find()
          .populate('listing_id', 'title')
          .populate('guest_id', 'name email')
          .sort({ createdAt: -1 })
          .limit(10)
          .exec(),
        this.userModel.countDocuments({ 'role.type': 'guest' }).exec(),
        this.userModel.countDocuments({ 'role.type': 'host' }).exec(),
        this.userModel.countDocuments({ 'role.type': 'admin' }).exec(),
        this.userModel.countDocuments({ isActive: true }).exec(),
        this.userModel
          .find()
          .select('name email role isActive email_verified createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
          .exec(),
      ]);

      return {
        stats: {
          totalUsers,
          totalListings,
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeListings,
          pendingBookings,
          totalGuests,
          totalHosts,
          totalAdmins,
          activeUsers,
        },
        recentBookings,
        recentUsers,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting dashboard: ${error.message}`);
    }
  }

  async getAllListings(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [listings, total] = await Promise.all([
        this.listingModel
          .find()
          .populate('host_id', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.listingModel.countDocuments().exec(),
      ]);

      return {
        data: listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting listings: ${error.message}`);
    }
  }

  async getListingDetails(id: string) {
    try {
      const listing = await this.listingModel
        .findById(id)
        .populate('host_id', 'name email avatar_url')
        .exec();

      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }

      // Get listing images - handle both ObjectId and string formats (same as public service)
      const listingIdForImages = Types.ObjectId.isValid(id) ? [new Types.ObjectId(id), id] : [id];
      const listingImages = await this.listingImageModel
        .find({ listing_id: { $in: listingIdForImages } })
        .exec();

      return {
        listing,
        images: listingImages,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting listing details: ${error.message}`);
    }
  }

  async getAllBookings(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [bookings, total] = await Promise.all([
        this.bookingModel
          .find()
          .populate('listing_id', 'title')
          .populate('guest_id', 'name email')
          .populate('host_id', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.bookingModel.countDocuments().exec(),
      ]);

      return {
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting bookings: ${error.message}`);
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        this.userModel
          .find()
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments().exec(),
      ]);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting users: ${error.message}`);
    }
  }

  async updateListingStatus(id: string, status: string) {
    try {
      const listing = await this.listingModel.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      ).exec();

      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }

      return listing;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating listing status: ${error.message}`);
    }
  }

  async updateBookingStatus(id: string, status: string) {
    try {
      const booking = await this.bookingModel.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      ).exec();

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      return booking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating booking status: ${error.message}`);
    }
  }

  async updateUserStatus(id: string, isActive: boolean) {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        id,
        { isActive },
        { new: true },
      ).select('-password').exec();

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating user status: ${error.message}`);
    }
  }

  async deleteListing(id: string) {
    try {
      const listing = await this.listingModel.findByIdAndDelete(id).exec();
      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }
      return { message: 'Listing deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting listing: ${error.message}`);
    }
  }

  async getAllPayments(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [payments, total] = await Promise.all([
        this.paymentModel
          .find()
          .populate('booking_id', 'check_in check_out total_price currency')
          .populate('user_id', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.paymentModel.countDocuments().exec(),
      ]);

      return {
        data: payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting payments: ${error.message}`);
    }
  }

  async getSettings() {
    try {
      let settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        // Create default settings if none exist
        settings = await this.settingsModel.create({
          siteName: 'Airbnb Clone',
          siteDescription: 'Platform đặt phòng trực tuyến',
          adminEmail: 'admin@example.com',
        });
      }
      return settings;
    } catch (error) {
      throw new InternalServerErrorException(`Error getting settings: ${error.message}`);
    }
  }

  async updateSettings(settingsData: Partial<Settings>) {
    try {
      let settings = await this.settingsModel.findOne().exec();
      if (!settings) {
        settings = await this.settingsModel.create(settingsData);
      } else {
        settings = await this.settingsModel.findOneAndUpdate(
          {},
          settingsData,
          { new: true, upsert: true }
        ).exec();
      }
      return settings;
    } catch (error) {
      throw new InternalServerErrorException(`Error updating settings: ${error.message}`);
    }
  }
}

