import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Calendar, CalendarDocument } from '../calendars/schemas/calendar.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';

export interface DashboardStats {
  listings: {
    total: number;
    active: number;
    inactive: number;
  };
  earnings: {
    total: number;
    monthly: Array<{
      month: string;
      revenue: number;
    }>;
    trend: string; // 'up' | 'down' | 'stable'
  };
  bookings: {
    total: number;
    upcoming: number;
    completionRate: number;
  };
  occupancy: {
    average: number;
    totalDays: number;
    bookedDays: number;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    recentReviews: Array<{
      _id: string;
      listing_id: string;
      rating: number;
      comment: string;
      reviewer_id: string;
      createdAt: Date;
    }>;
  };
  topListings: Array<{
    _id: string;
    title: string;
    cover_image?: string;
    city: string;
    price_base: number;
    currency: string;
    revenue: number;
    bookingCount: number;
    avgRating: number;
    occupancyRate: number;
  }>;
}

@Injectable()
export class ListingsStatsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async getHostDashboardStats(hostId: string): Promise<DashboardStats> {
    const hostObjectId = new Types.ObjectId(hostId);

    // Get listings stats
    const listingsStats = await this.getListingsStats(hostObjectId);

    // Get earnings stats
    const earningsStats = await this.getEarningsStats(hostObjectId);

    // Get bookings stats
    const bookingsStats = await this.getBookingsStats(hostObjectId);

    // Get occupancy stats
    const occupancyStats = await this.getOccupancyStats(hostObjectId);

    // Get reviews stats
    const reviewsStats = await this.getReviewsStats(hostObjectId);

    // Get top listings
    const topListings = await this.getTopListings(hostObjectId);

    return {
      listings: listingsStats,
      earnings: earningsStats,
      bookings: bookingsStats,
      occupancy: occupancyStats,
      reviews: reviewsStats,
      topListings,
    };
  }

  private async getListingsStats(
    hostId: Types.ObjectId,
  ): Promise<DashboardStats['listings']> {
    const [total, active, inactive] = await Promise.all([
      this.listingModel.countDocuments({ host_id: hostId }),
      this.listingModel.countDocuments({
        host_id: hostId,
        status: 'active',
      }),
      this.listingModel.countDocuments({
        host_id: hostId,
        status: 'inactive',
      }),
    ]);

    return { total, active, inactive };
  }

  private async getEarningsStats(
    hostId: Types.ObjectId,
  ): Promise<DashboardStats['earnings']> {
    // Get all bookings for this host
    const hostListings = await this.listingModel.find({ host_id: hostId }).lean();
    const listingIds = hostListings.map((l) => l._id);

    // Get all completed/confirmed bookings with their total prices
    const bookings = await this.bookingModel
      .find({
        listing_id: { $in: listingIds },
        status: { $in: ['completed', 'confirmed'] },
      })
      .lean();

    // Calculate total earnings
    const total = bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);

    // Calculate monthly breakdown for last 12 months
    const monthlyData: Record<string, number> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = 0;
    }

    // Sum up bookings by month
    bookings.forEach((booking: any) => {
      const bookingDate = new Date(booking.createdAt);
      const monthKey = bookingDate.toISOString().slice(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += booking.total_price || 0;
      }
    });

    const monthly = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // Calculate trend
    const lastThreeMonths = monthly.slice(-3);
    const firstSum = lastThreeMonths[0]?.revenue || 0;
    const lastSum = lastThreeMonths[2]?.revenue || 0;
    const trend =
      lastSum > firstSum * 1.1
        ? 'up'
        : lastSum < firstSum * 0.9
          ? 'down'
          : 'stable';

    return { total, monthly, trend };
  }

  private async getBookingsStats(
    hostId: Types.ObjectId,
  ): Promise<DashboardStats['bookings']> {
    // Get all listings for this host
    const hostListings = await this.listingModel.find({ host_id: hostId }).lean();
    const listingIds = hostListings.map((l) => l._id);

    // Get total bookings
    const total = await this.bookingModel.countDocuments({
      listing_id: { $in: listingIds },
    });

    // Get upcoming bookings (check_in >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = await this.bookingModel.countDocuments({
      listing_id: { $in: listingIds },
      check_in: { $gte: today },
      status: { $in: ['pending', 'confirmed'] },
    });

    // Calculate completion rate (completed / total)
    const completed = await this.bookingModel.countDocuments({
      listing_id: { $in: listingIds },
      status: 'completed',
    });
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      upcoming,
      completionRate: Math.round(completionRate),
    };
  }

  private async getOccupancyStats(
    hostId: Types.ObjectId,
  ): Promise<DashboardStats['occupancy']> {
    // Get all listings for this host
    const hostListings = await this.listingModel.find({ host_id: hostId }).lean();
    const listingIds = hostListings.map((l) => l._id);

    // Get calendar data for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const calendarData = await this.calendarModel
      .find({
        listing_id: { $in: listingIds },
        date: { $gte: ninetyDaysAgo },
      })
      .lean();

    const totalDays = calendarData.length;
    const bookedDays = calendarData.filter((c) => c.status === 'booked').length;

    const average = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;

    return {
      average,
      totalDays,
      bookedDays,
    };
  }

  private async getReviewsStats(
    hostId: Types.ObjectId,
  ): Promise<DashboardStats['reviews']> {
    // Get all listings for this host
    const hostListings = await this.listingModel.find({ host_id: hostId }).lean();
    const listingIds = hostListings.map((l) => l._id);

    // Get all reviews for these listings
    const allReviews = await this.reviewModel
      .find({ listing_id: { $in: listingIds } })
      .lean();

    // Calculate average rating
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    // Get recent 5 reviews sorted by creation date
    const recentReviews = await this.reviewModel
      .find({ listing_id: { $in: listingIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const formattedReviews = recentReviews.map((review: any) => ({
      _id: review._id.toString(),
      listing_id: review.listing_id.toString(),
      rating: review.rating,
      comment: review.comment || '',
      reviewer_id: review.reviewer_id.toString(),
      createdAt: review.createdAt,
    }));

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: allReviews.length,
      recentReviews: formattedReviews,
    };
  }

  private async getTopListings(hostId: Types.ObjectId): Promise<DashboardStats['topListings']> {
    // Get all active listings for this host
    const hostListings = await this.listingModel
      .find({ host_id: hostId, status: 'active' })
      .lean();

    if (hostListings.length === 0) {
      return [];
    }

    // For each listing, calculate revenue and occupancy
    const topListingsData = await Promise.all(
      hostListings.map(async (listing: any) => {
        // Get revenue for this listing
        const bookings = await this.bookingModel
          .find({
            listing_id: listing._id,
            status: { $in: ['completed', 'confirmed'] },
          })
          .lean();

        const revenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const bookingCount = bookings.length;

        // Calculate occupancy rate
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const calendarData = await this.calendarModel
          .find({
            listing_id: listing._id,
            date: { $gte: ninetyDaysAgo },
          })
          .lean();

        const totalDays = calendarData.length;
        const bookedDays = calendarData.filter((c) => c.status === 'booked').length;
        const occupancyRate = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;

        return {
          _id: listing._id.toString(),
          title: listing.title,
          cover_image: listing.cover_image || undefined,
          city: listing.city,
          price_base: listing.price_base,
          currency: listing.currency,
          revenue,
          bookingCount,
          avgRating: listing.avg_rating || 0,
          occupancyRate,
        };
      }),
    );

    // Sort by revenue descending and return top 5
    return topListingsData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }
}
