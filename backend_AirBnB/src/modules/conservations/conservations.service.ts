import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation, ConversationDocument } from './schemas/conservation.schema';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Types } from 'mongoose';

@Injectable()
export class ConservationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  private withDefaultPopulate(query: any) {
    return query
      .populate('guest_id', 'name avatar_url')
      .populate('host_id', 'name avatar_url')
      .populate('listing_id', 'title city country')
      .populate('booking_id');
  }

  async createFromBooking(bookingId: string, currentUserId: string): Promise<Conversation> {
    try {
      if (!bookingId) {
        throw new BadRequestException('bookingId is required');
      }
      const booking = await this.bookingModel.findById(bookingId).exec();
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      const guestId = booking.guest_id?.toString();
      const hostId = booking.host_id?.toString();
      const current = currentUserId?.toString();

      if (!current || (current !== guestId && current !== hostId)) {
        throw new BadRequestException('Bạn không có quyền truy cập cuộc trò chuyện của booking này');
      }

      const existing = await this.conversationModel.findOne({ booking_id: booking._id }).exec();
      if (existing) {
        return this.findOne(existing._id.toString());
      }

      const createdConversation = new this.conversationModel({
        booking_id: booking._id,
        guest_id: booking.guest_id,
        host_id: booking.host_id,
        listing_id: booking.listing_id,
        last_updated: new Date(),
        last_message_at: undefined,
        last_message_preview: '',
      });

      const saved = await createdConversation.save();
      return this.findOne(saved._id.toString());
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating conversation: ${error.message}`);
    }
  }

  async create(createConservationDto: CreateConservationDto, currentUserId?: string): Promise<Conversation> {
    try {
      // Prefer booking-based creation to enforce participants
      return await this.createFromBooking(createConservationDto.booking_id, currentUserId || '');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating conversation: ${error.message}`);
    }
  }

  async findAll(): Promise<Conversation[]> {
    try {
      return await this.withDefaultPopulate(
        this.conversationModel.find().sort({ last_updated: -1 }),
      ).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding conversations: ${error.message}`);
    }
  }

  async findMine(currentUserId: string): Promise<Conversation[]> {
    try {
      if (!currentUserId) {
        throw new BadRequestException('Người dùng chưa đăng nhập');
      }
      const idString = currentUserId.toString();
      const objectId = Types.ObjectId.isValid(idString) ? new Types.ObjectId(idString) : null;
      const orConditions: any[] = [{ guest_id: idString }, { host_id: idString }];
      if (objectId) {
        orConditions.push({ guest_id: objectId }, { host_id: objectId });
      }
      const filter = { $or: orConditions };
      return await this.withDefaultPopulate(
        this.conversationModel.find(filter).sort({ last_updated: -1 }),
      ).exec();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Error finding conversations: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Conversation> {
    try {
      const conversation = await this.withDefaultPopulate(
        this.conversationModel.findById(id),
      ).exec();
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding conversation: ${error.message}`);
    }
  }

  isParticipant(conversation: Conversation, userId: string): boolean {
    const normalizeId = (value: any): string => {
      if (!value) return '';
      // If populated document with _id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyVal: any = value as any;
      if (anyVal._id) {
        return anyVal._id.toString();
      }
      if (typeof value === 'string') return value;
      try {
        return value.toString();
      } catch {
        return '';
      }
    };

    const uid = normalizeId(userId);
    const guestId = normalizeId((conversation as any).guest_id);
    const hostId = normalizeId((conversation as any).host_id);

    return (
      !!uid &&
      (guestId === uid || hostId === uid)
    );
  }

  getOtherParticipantId(conversation: Conversation, userId: string): string {
    const normalizeId = (value: any): string => {
      if (!value) return '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyVal: any = value as any;
      if (anyVal._id) {
        return anyVal._id.toString();
      }
      if (typeof value === 'string') return value;
      try {
        return value.toString();
      } catch {
        return '';
      }
    };

    const uid = normalizeId(userId);
    if (!this.isParticipant(conversation, uid)) {
      throw new BadRequestException('Bạn không thuộc cuộc hội thoại này');
    }
    const guestId = normalizeId((conversation as any).guest_id);
    const hostId = normalizeId((conversation as any).host_id);
    return uid === guestId ? hostId : guestId;
  }

  async touchLastMessage(conversationId: string, preview: string, at: Date): Promise<void> {
    await this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        {
          last_message_preview: preview || '',
          last_message_at: at,
          last_updated: new Date(),
        },
        { new: false },
      )
      .exec();
  }

  async update(id: string, updateConservationDto: UpdateConservationDto): Promise<Conversation> {
    try {
      const updatedConversation = await this.conversationModel
        .findByIdAndUpdate(id, { ...updateConservationDto, last_updated: new Date() }, { new: true })
        .exec();
      if (!updatedConversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      return updatedConversation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating conversation: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.conversationModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting conversation: ${error.message}`);
    }
  }
}
