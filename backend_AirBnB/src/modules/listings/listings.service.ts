import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { ListingImage, ListingImageDocument } from '../listing_images/schemas/listing_image.schema';
import { Calendar, CalendarDocument } from '../calendars/schemas/calendar.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ListingImage.name) private listingImageModel: Model<ListingImageDocument>,
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createListingDto: CreateListingDto): Promise<Listing> {
    try {
      // Set status to 'inactive' by default for admin approval
      const listingData = {
        ...createListingDto,
        status: 'inactive',
      };
      const createdListing = new this.listingModel(listingData);
      const savedListing = await createdListing.save();

      // Update user role to 'host' and add listing ID to listID
      if (createListingDto.host_id) {
        const userId = new Types.ObjectId(createListingDto.host_id);
        const user = await this.userModel.findById(userId);
        
        if (user) {
          // If user doesn't have host role, set it
          if (!user.role || user.role.type !== 'host') {
            user.role = {
              type: 'host',
              listID: [savedListing._id.toString()],
            };
          } else {
            // If user already has host role, add listing ID to listID if not exists
            const listID = user.role.listID || [];
            if (!listID.includes(savedListing._id.toString())) {
              listID.push(savedListing._id.toString());
              user.role.listID = listID;
            }
          }
          await user.save();
        }
      }

      return savedListing;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Listing already exists');
      }
      throw new InternalServerErrorException(`Error creating listing: ${error.message}`);
    }
  }

  async findAll(query?: string): Promise<Listing[]> {
    try {
      if (query) {
        const { filter } = require('api-query-params')(query);
        return await this.listingModel.find(filter).exec();
      }
      return await this.listingModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding listings: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const listing = await this.listingModel.findById(id).exec();
      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }

      // Get images for this listing
      const listingIdForImages = Types.ObjectId.isValid(id) ? [new Types.ObjectId(id), id] : [id];
      const images = await this.listingImageModel
        .find({ listing_id: { $in: listingIdForImages } })
        .lean();

      return {
        ...listing.toObject(),
        images,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding listing: ${error.message}`);
    }
  }

  async getListingDetails(
    id: string,
    checkInDate?: string,
    checkOutDate?: string,
    guests?: number,
  ) {
    try {
      const listing = await this.listingModel
        .findById(id)
        .populate('host_id', 'name email avatar_url bio')
        .exec();

      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }

      // Get images
      const listingIdForImages = Types.ObjectId.isValid(id) ? [new Types.ObjectId(id), id] : [id];
      const images = await this.listingImageModel
        .find({ listing_id: { $in: listingIdForImages } })
        .exec();

      // Get reviews with reviewer info
      const reviews = await this.reviewModel
        .find({ listing_id: new Types.ObjectId(id) })
        .populate('reviewer_id', 'name avatar_url')
        .populate('booking_id')
        .sort({ createdAt: -1 })
        .exec();

      // Calculate average rating from reviews
      let avgRating = 0;
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        avgRating = totalRating / reviews.length;
      }

      // Get calendar availability if dates are provided
      let availability: {
        isAvailable: boolean;
        checkInDate: Date;
        checkOutDate: Date;
        nights: number;
        totalPrice: number;
        currency: string;
      } | null = null;
      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Check if dates are available
        const calendarEntries = await this.calendarModel
          .find({
            listing_id: new Types.ObjectId(id),
            date: {
              $gte: checkIn,
              $lt: checkOut,
            },
          })
          .exec();

        // Chỉ giữ chỗ tạm thời cho booking pending trong 5 phút gần nhất
        const pendingExpiry = new Date(Date.now() - 5 * 60 * 1000);

        // Check for conflicting bookings:
        // - confirmed: luôn tính là trùng
        // - pending: chỉ tính là trùng nếu được tạo trong vòng 5 phút gần nhất
        const conflictingBookings = await this.bookingModel.find({
          listing_id: new Types.ObjectId(id),
          $or: [
            {
              status: 'confirmed',
              check_in: { $lte: checkOut },
              check_out: { $gte: checkIn },
            },
            {
              status: 'pending',
              createdAt: { $gte: pendingExpiry },
              check_in: { $lte: checkOut },
              check_out: { $gte: checkIn },
            },
          ],
        }).exec();

        const isAvailable = calendarEntries.every(
          (entry) => entry.status === 'available' && !conflictingBookings.length,
        );

        // Calculate price for the date range
        let totalPrice = 0;
        if (calendarEntries.length > 0) {
          totalPrice = calendarEntries.reduce((sum, entry) => sum + (entry.price || listing.price_base), 0);
        } else {
          // Use base price if no calendar entries
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          totalPrice = listing.price_base * nights;
        }

        // Add cleaning fee and extra guest fee
        totalPrice += listing.cleaning_fee || 0;
        if (guests && guests > listing.guests) {
          const extraGuests = guests - listing.guests;
          totalPrice += (listing.extra_guest_fee || 0) * extraGuests;
        }

        availability = {
          isAvailable,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
          totalPrice,
          currency: listing.currency || 'USD',
        };
      }

      return {
        listing: {
          ...listing.toObject(),
          avg_rating: avgRating || listing.avg_rating,
          review_count: reviews.length,
        },
        images,
        reviews,
        availability,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting listing details: ${error.message}`);
    }
  }

  async update(id: string, updateListingDto: UpdateListingDto): Promise<Listing> {
    try {
      const updatedListing = await this.listingModel
        .findByIdAndUpdate(id, updateListingDto, { new: true })
        .exec();
      if (!updatedListing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }
      return updatedListing;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating listing: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.listingModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting listing: ${error.message}`);
    }
  }

  async search(searchDto: SearchListingDto) {
    try {
      const {
        city,
        country,
        check_in,
        check_out,
        guests,
        min_price,
        max_price,
        latitude,
        longitude,
        radius = 10,
        page = 1,
        limit = 10,
        sort_by = 'createdAt',
        sort_order = 'desc',
        amenities,
        bedrooms_min,
        beds_min,
        bathrooms_min,
        keyword,
      } = searchDto;

      // Build filter query
      const filter: any = {
        status: 'active', // Only show active listings
      };

      // Location filters - make them more flexible
      if (latitude && longitude) {
        // Use geospatial search if coordinates are provided
        // MongoDB geospatial query: find listings within radius (in radians)
        // 1 degree latitude ≈ 111 km, so radius in km / 111 = radius in degrees
        const radiusInDegrees = radius / 111;
        
        filter.latitude = {
          $gte: latitude - radiusInDegrees,
          $lte: latitude + radiusInDegrees,
        };
        filter.longitude = {
          $gte: longitude - radiusInDegrees,
          $lte: longitude + radiusInDegrees,
        };
        // Also filter by actual distance using $geoWithin (if we had geospatial index)
        // For now, we'll filter by bounding box and calculate distance in code if needed
      } else {
        // Use text-based location search
        if (city) {
          filter.city = { $regex: city, $options: 'i' };
        }
        if (country) {
          filter.country = { $regex: country, $options: 'i' };
        }
      }

      // Guests filter
      if (guests) {
        filter.guests = { $gte: guests };
      }

      // Price filter
      if (min_price !== undefined || max_price !== undefined) {
        filter.price_base = {};
        if (min_price !== undefined) {
          filter.price_base.$gte = min_price;
        }
        if (max_price !== undefined) {
          filter.price_base.$lte = max_price;
        }
      }

      // Amenity filter (any-of)
      if (amenities && Array.isArray(amenities) && amenities.length > 0) {
        filter.amenities = { $in: amenities };
      }

      // Bedrooms / beds / bathrooms minimum
      if (bedrooms_min !== undefined) {
        filter.bedrooms = { $gte: bedrooms_min };
      }
      if (beds_min !== undefined) {
        filter.beds = { $gte: beds_min };
      }
      if (bathrooms_min !== undefined) {
        filter.bathrooms = { $gte: bathrooms_min };
      }

      // Keyword search on title/description
      if (keyword) {
        const regex = new RegExp(keyword, 'i');
        filter.$or = [
          { title: regex },
          { description: regex },
        ];
      }

      // Build sort
      const sort: any = {};
      sort[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Check availability if dates are provided
      let unavailableListingIds = new Set<string>();
      if (check_in && check_out) {
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (checkInDate >= checkOutDate) {
          throw new BadRequestException('Ngày check-out phải sau ngày check-in');
        }

        // Calendars: any day in range not available
        const blockedCalendars = await this.calendarModel.aggregate([
          {
            $match: {
              date: { $gte: checkInDate, $lt: checkOutDate },
              status: { $in: ['booked', 'blocked'] },
            },
          },
          { $group: { _id: '$listing_id' } },
        ]);

        blockedCalendars.forEach((doc) => unavailableListingIds.add(doc._id.toString()));

        // Bookings that overlap (excluding cancelled)
        // Giữ booking pending tối đa 5 phút trong tính toán availability
        const pendingExpiry = new Date(Date.now() - 5 * 60 * 1000);
        const conflictingBookings = await this.bookingModel.find({
          $or: [
            {
              status: { $nin: ['cancelled', 'pending'] },
              check_in: { $lte: checkOutDate },
              check_out: { $gte: checkInDate },
            },
            {
              status: 'pending',
              createdAt: { $gte: pendingExpiry },
              check_in: { $lte: checkOutDate },
              check_out: { $gte: checkInDate },
            },
          ],
        }).exec();

        conflictingBookings.forEach((b) => unavailableListingIds.add(b.listing_id.toString()));

        if (unavailableListingIds.size > 0) {
          const bookedIds = Array.from(unavailableListingIds).map((id) => new Types.ObjectId(id));
          filter._id = { $nin: bookedIds };
        }
      }

      // Get total count for pagination
      const totalCount = await this.listingModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / limit);

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Find listings matching filters
      const listings = await this.listingModel
        .find(filter)
        .populate('host_id', 'name email avatar_url')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();

      // Enrich listings with cover image and availability/price if date range provided
      const checkInDateObj = check_in ? new Date(check_in) : null;
      const checkOutDateObj = check_out ? new Date(check_out) : null;
      const nights =
        checkInDateObj && checkOutDateObj
          ? Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24))
          : null;

      const data = await Promise.all(
        listings.map(async (listing) => {
          // cover image
          const cover = await this.listingImageModel
            .findOne({ listing_id: { $in: [listing._id, listing._id.toString()] } })
            .sort({ is_cover: -1, createdAt: -1 })
            .exec();
          const cover_image = cover?.image_url?.[0] || null;

          let availability: any = null;
          if (checkInDateObj && checkOutDateObj && nights) {
            const calendarEntries = await this.calendarModel
              .find({
                listing_id: listing._id,
                date: { $gte: checkInDateObj, $lt: checkOutDateObj },
              })
              .exec();

            const isAvailable =
              calendarEntries.length === 0
                ? true
                : calendarEntries.every((entry) => entry.status === 'available');

            let totalPrice = 0;
            if (calendarEntries.length > 0) {
              totalPrice = calendarEntries.reduce(
                (sum, entry) => sum + (entry.price ?? listing.price_base),
                0,
              );
            } else {
              totalPrice = listing.price_base * nights;
            }

            // Cleaning fee (once per stay)
            totalPrice += listing.cleaning_fee || 0;

            // Extra guest fee (per extra guest, per night? Keep parity with existing logic: per stay)
            if (guests && listing.guests && guests > listing.guests) {
              const extraGuests = guests - listing.guests;
              totalPrice += (listing.extra_guest_fee || 0) * extraGuests;
            }

            availability = {
              isAvailable,
              checkInDate: checkInDateObj,
              checkOutDate: checkOutDateObj,
              nights,
              totalPrice,
              currency: listing.currency || 'USD',
            };
          }

          return {
            ...listing.toObject(),
            cover_image,
            availability,
          };
        }),
      );

      return {
        data,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error searching listings: ${error.message}`);
    }
  }

  async findHostListings(userId: string): Promise<any[]> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const user = await this.userModel.findById(userObjectId).exec();

      const listIds = (user?.role?.listID || [])
        .map((id: string) => {
          try {
            return new Types.ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Types.ObjectId[];

      // Build query to handle both ObjectId and string formats for host_id
      const orConditions: any[] = [
        { host_id: userObjectId },
        // Use $expr to convert host_id to string and compare with userId string
        {
          $expr: {
            $eq: [{ $toString: '$host_id' }, userId],
          },
        },
      ];

      if (listIds.length > 0) {
        orConditions.push({ _id: { $in: listIds } });
      }

      const filter: any = { $or: orConditions };

      const listings = await this.listingModel
        .find(filter)
        .populate('host_id', 'name email avatar_url')
        .sort({ createdAt: -1 })
        .exec();

      // Enrich listings with cover images
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const cover = await this.listingImageModel
            .findOne({ listing_id: { $in: [listing._id, listing._id.toString()] } })
            .sort({ is_cover: -1, createdAt: -1 })
            .exec();
          
          const cover_image = cover?.image_url?.[0] || null;

          return {
            ...listing.toObject(),
            cover_image,
          };
        }),
      );

      return enrichedListings;
    } catch (error) {
      throw new InternalServerErrorException(`Error finding host listings: ${error.message}`);
    }
  }

  async getListingAnalytics(id: string) {
    try {
      const listingId = new Types.ObjectId(id);

      // Get basic listing info
      const listing = await this.listingModel.findById(listingId).exec();
      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }

      // Get total bookings
      const totalBookings = await this.bookingModel.countDocuments({
        listing_id: listingId,
        status: { $in: ['confirmed', 'completed'] },
      });

      // Get monthly booking trend
      const bookingTrend = await this.bookingModel.aggregate([
        {
          $match: {
            listing_id: listingId,
            status: { $in: ['confirmed', 'completed'] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            totalRevenue: {
              $sum: '$total_price',
            },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      // Get reviews and ratings
      const reviews = await this.reviewModel.find({
        listing_id: listingId,
      }).exec();

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Get occupancy info from calendar
      const totalDays = await this.calendarModel.countDocuments({
        listing_id: listingId,
      });

      const bookedDays = await this.calendarModel.countDocuments({
        listing_id: listingId,
        status: 'booked',
      });

      const occupancyRate = totalDays > 0 ? (bookedDays / totalDays) * 100 : 0;

      // Get current month bookings
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const currentMonthBookings = await this.bookingModel.countDocuments({
        listing_id: listingId,
        status: { $in: ['confirmed', 'completed'] },
        check_in: { $gte: startOfMonth, $lt: endOfMonth },
      });

      return {
        listingId: id,
        title: listing.title,
        totalBookings,
        currentMonthBookings,
        avgRating: parseFloat(avgRating.toFixed(2)),
        reviewCount: reviews.length,
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        bookingTrend: bookingTrend.map((item) => ({
          month: `${item._id.month}/${item._id.year}`,
          bookings: item.count,
          revenue: parseFloat(item.totalRevenue.toFixed(2)),
        })),
        ratingDistribution: this.calculateRatingDistribution(reviews),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting listing analytics: ${error.message}`);
    }
  }

  async getHostListingAnalytics(listingId: string, hostId: string) {
    try {
      const listingObjectId = new Types.ObjectId(listingId);
      const hostObjectId = new Types.ObjectId(hostId);

      // Verify that the listing belongs to this host
      const listing = await this.listingModel.findById(listingObjectId).exec();
      if (!listing) {
        throw new NotFoundException(`Listing with ID ${listingId} not found`);
      }

      // Check if listing belongs to the host
      const listingHostId = listing.host_id.toString();
      const requestingUserId = hostObjectId.toString();
      if (listingHostId !== requestingUserId && listing.host_id.toString() !== hostId) {
        throw new ForbiddenException('You do not have permission to view this listing analytics');
      }

      // Return the same analytics as getListingAnalytics
      return this.getListingAnalytics(listingId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting listing analytics: ${error.message}`);
    }
  }

  async getListingsStats() {
    try {
      const total = await this.listingModel.countDocuments();
      const active = await this.listingModel.countDocuments({ status: 'active' });
      const pending = await this.listingModel.countDocuments({ status: 'inactive' });

      // Get revenue from all completed bookings
      const bookingStats = await this.bookingModel.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'completed'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_price' },
            totalBookings: { $sum: 1 },
          },
        },
      ]);

      const totalRevenue = bookingStats[0]?.totalRevenue || 0;
      const totalBookings = bookingStats[0]?.totalBookings || 0;

      return {
        totalListings: total,
        activeListings: active,
        pendingListings: pending,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalBookings,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting listings stats: ${error.message}`);
    }
  }

  async bulkUpdateListings(ids: string[], updateData: UpdateListingDto): Promise<any> {
    try {
      const objectIds = ids.map((id) => new Types.ObjectId(id));

      const result = await this.listingModel.updateMany(
        { _id: { $in: objectIds } },
        updateData,
      );

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error bulk updating listings: ${error.message}`);
    }
  }

  private calculateRatingDistribution(reviews: ReviewDocument[]): Record<number, number> {
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = Math.round(review.rating);
      if (distribution.hasOwnProperty(rating)) {
        distribution[rating]++;
      }
    });

    return distribution;
  }
}
