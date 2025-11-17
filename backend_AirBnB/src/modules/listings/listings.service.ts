import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async create(createListingDto: CreateListingDto): Promise<Listing> {
    try {
      const createdListing = new this.listingModel(createListingDto);
      return await createdListing.save();
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

      // Build sort
      const sort: any = {};
      sort[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Check availability if dates are provided
      let bookedListingIds = new Set<string>();
      if (check_in && check_out) {
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (checkInDate >= checkOutDate) {
          throw new BadRequestException('Ngày check-out phải sau ngày check-in');
        }

        // Get all bookings that overlap with the requested dates
        const conflictingBookings = await this.bookingModel.find({
          status: { $in: ['pending', 'confirmed'] },
          $or: [
            {
              check_in: { $lte: checkOutDate },
              check_out: { $gte: checkInDate },
            },
          ],
        }).exec();

        bookedListingIds = new Set(
          conflictingBookings.map((booking) => booking.listing_id.toString())
        );

        // Add booked listings to filter (exclude booked listing IDs)
        if (bookedListingIds.size > 0) {
          const bookedIds = Array.from(bookedListingIds).map(id => new Types.ObjectId(id));
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

      return {
        data: listings,
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
}
