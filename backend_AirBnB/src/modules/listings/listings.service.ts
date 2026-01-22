import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string): Promise<Listing> {
    try {
      const listing = await this.listingModel.findById(id).exec();
      if (!listing) {
        throw new NotFoundException(`Listing with ID ${id} not found`);
      }
      return listing;
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
      const images = await this.listingImageModel
        .find({ listing_id: new Types.ObjectId(id) })
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

        // Check for conflicting bookings
        const conflictingBookings = await this.bookingModel.find({
          listing_id: new Types.ObjectId(id),
          status: { $in: ['pending', 'confirmed'] },
          $or: [
            {
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
        const conflictingBookings = await this.bookingModel.find({
          status: { $nin: ['cancelled'] },
          check_in: { $lte: checkOutDate },
          check_out: { $gte: checkInDate },
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
            .findOne({ listing_id: listing._id })
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

  async findHostListings(hostId: string): Promise<Listing[]> {
    try {
      return await this.listingModel
        .find({ host_id: new Types.ObjectId(hostId) })
        .populate('host_id', 'name email avatar_url')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding host listings: ${error.message}`);
    }
  }
}
