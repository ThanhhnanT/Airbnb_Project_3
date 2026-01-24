import { Injectable, ForbiddenException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { Payout, PayoutDocument } from '../payouts/schemas/payout.schema';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { ListingImage, ListingImageDocument } from '../listing_images/schemas/listing_image.schema';
import { PaymentsService } from '../payments/payments.service';
import { PayoutsService } from '../payouts/payouts.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    @InjectModel(ListingImage.name) private listingImageModel: Model<ListingImageDocument>,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => PayoutsService))
    private payoutsService: PayoutsService,
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

      // Get listing images - the listing_id may be stored as string or ObjectId
      // Create array with all possible ID formats
      const listingIdVariants: any[] = [id];
      
      if (Types.ObjectId.isValid(id)) {
        const objId = new Types.ObjectId(id);
        listingIdVariants.push(objId);
      }

      const listingImages = await this.listingImageModel
        .find({ listing_id: { $in: listingIdVariants } })
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

  async getUserDetails(id: string) {
    try {
      const user = await this.userModel
        .findById(id)
        .select('-password')
        .exec();

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return {
        data: user,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting user details: ${error.message}`);
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

  // Payment management methods
  async getPaymentStats(filters?: any) {
    try {
      return await this.paymentsService.getPaymentStats(filters);
    } catch (error) {
      throw new InternalServerErrorException(`Error getting payment stats: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string, reason: string, adminId?: string) {
    try {
      return await this.paymentsService.refundPayment(paymentId, reason, adminId);
    } catch (error) {
      throw error;
    }
  }

  async exportPaymentsCSV(filters?: any): Promise<string> {
    try {
      return await this.paymentsService.exportPaymentsCSV(filters);
    } catch (error) {
      throw new InternalServerErrorException(`Error exporting payments: ${error.message}`);
    }
  }

  // Payout management methods
  async getAllPayouts(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const [payouts, total] = await Promise.all([
        this.payoutModel
          .find()
          .populate('host_id', 'name email')
          .populate('booking_id', 'check_in check_out')
          .populate('bank_account_id', 'bank_name account_number account_holder_name')
          .populate('processed_by', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.payoutModel.countDocuments().exec(),
      ]);

      return {
        data: payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting payouts: ${error.message}`);
    }
  }

  async getPayoutStats(): Promise<{
    total: number;
    pending: number;
    paid: number;
    failed: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    try {
      const payouts = await this.payoutModel.find().exec();

      const stats = {
        total: payouts.length,
        pending: 0,
        paid: 0,
        failed: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
      };

      payouts.forEach((payout) => {
        stats.totalAmount += payout.amount;
        if (payout.status === 'pending') {
          stats.pending++;
          stats.pendingAmount += payout.amount;
        } else if (payout.status === 'paid') {
          stats.paid++;
          stats.paidAmount += payout.amount;
        } else if (payout.status === 'failed') {
          stats.failed++;
        }
      });

      return stats;
    } catch (error) {
      throw new InternalServerErrorException(`Error getting payout stats: ${error.message}`);
    }
  }

  async batchMarkPayoutAsPaid(
    payoutIds: string[],
    adminId: string,
    adminNote?: string,
  ): Promise<any[]> {
    try {
      const updatedPayouts: any[] = [];
      for (const payoutId of payoutIds) {
        const payout = await this.payoutsService.markAsPaid(
          payoutId,
          adminId,
          adminNote,
        );
        updatedPayouts.push(payout);
      }
      return updatedPayouts;
    } catch (error) {
      throw new InternalServerErrorException(`Error marking payouts as paid: ${error.message}`);
    }
  }

  async schedulePayouts(
    payoutIds: string[],
    scheduledAt: Date,
    sendNotification?: boolean,
  ): Promise<any> {
    try {
      // Store scheduled payouts (can be implemented with a cron job)
      const scheduledPayouts: any[] = [];
      for (const payoutId of payoutIds) {
        const payout = await this.payoutModel
          .findByIdAndUpdate(
            payoutId,
            {
              scheduled_at: scheduledAt,
              send_notification: sendNotification || false,
            },
            { new: true } as any,
          )
          .exec();
        if (payout) {
          scheduledPayouts.push(payout);
        }
      }
      return {
        message: `Scheduled ${scheduledPayouts.length} payout(s)`,
        payouts: scheduledPayouts,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error scheduling payouts: ${error.message}`);
    }
  }

  async generateComplianceReport(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<string> {
    try {
      const query: any = {};

      if (filters?.status) query.status = filters.status;
      if (filters?.startDate && filters?.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const payouts = await this.payoutModel
        .find(query)
        .populate('host_id', 'name email')
        .populate('booking_id', 'check_in check_out')
        .exec();

      // Generate CSV with compliance information
      let csv =
        'Host Name,Host Email,Total Payout,Platform Fee,Currency,Status,Created Date,Processed Date\n';

      payouts.forEach((payout: any) => {
        const createdDate = new Date(payout.createdAt).toLocaleDateString('vi-VN');
        const processedDate = payout.processed_at
          ? new Date(payout.processed_at).toLocaleDateString('vi-VN')
          : '';

        csv += `"${(payout.host_id as any)?.name || ''}","${(payout.host_id as any)?.email || ''}",${payout.amount},${payout.platform_fee},"${payout.currency}","${payout.status}","${createdDate}","${processedDate}"\n`;
      });

      return csv;
    } catch (error) {
      throw new InternalServerErrorException(`Error generating compliance report: ${error.message}`);
    }
  }
}

