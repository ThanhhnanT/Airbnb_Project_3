import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model } from 'mongoose';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      const createdMessage = new this.messageModel(createMessageDto);
      return await createdMessage.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating message: ${error.message}`);
    }
  }

  async findAll(conversationId?: string, userId?: string): Promise<Message[]> {
    try {
      const filter: any = {};
      if (conversationId) filter.conversation_id = conversationId;
      if (userId) {
        filter.$or = [
          { sender_id: userId },
          { receiver_id: userId },
        ];
      }
      return await this.messageModel.find(filter)
        .populate('sender_id receiver_id')
        .sort({ sent_at: 1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding messages: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Message> {
    try {
      const message = await this.messageModel.findById(id).populate('sender_id receiver_id').exec();
      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      return message;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding message: ${error.message}`);
    }
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    try {
      const updatedMessage = await this.messageModel
        .findByIdAndUpdate(id, updateMessageDto, { new: true })
        .exec();
      if (!updatedMessage) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      return updatedMessage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating message: ${error.message}`);
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await this.messageModel.updateMany(
        { conversation_id: conversationId, receiver_id: userId, is_read: false },
        { is_read: true }
      ).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error marking messages as read: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.messageModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting message: ${error.message}`);
    }
  }
}
