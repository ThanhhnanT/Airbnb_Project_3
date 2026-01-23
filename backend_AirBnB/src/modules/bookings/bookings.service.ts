import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    try {
      const createdBooking = new this.bookingModel(createBookingDto);
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
