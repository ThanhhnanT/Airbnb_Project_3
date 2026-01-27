import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model } from 'mongoose';
import { ConservationsService } from '../conservations/conservations.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly conservationsService: ConservationsService,
  ) {}

  async createForUser(currentUserId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      const conversationId = createMessageDto.conversation_id;
      if (!conversationId) {
        throw new BadRequestException('conversation_id is required');
      }

      const conversation = await this.conservationsService.findOne(conversationId);
      if (!this.conservationsService.isParticipant(conversation, currentUserId)) {
        throw new BadRequestException('Bạn không thuộc cuộc hội thoại này');
      }

      const receiverId = this.conservationsService.getOtherParticipantId(conversation, currentUserId);
      const content = (createMessageDto.content || '').trim();
      const imageUrls = Array.isArray(createMessageDto.image_urls) ? createMessageDto.image_urls : [];

      if (!content && imageUrls.length === 0) {
        throw new BadRequestException('Tin nhắn không được để trống');
      }

      const createdMessage = new this.messageModel({
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content,
        image_urls: imageUrls,
        client_temp_id: createMessageDto.client_temp_id,
        sent_at: new Date(),
        is_read: false,
      });

      const saved = await createdMessage.save();

      const preview = content
        ? content.slice(0, 120)
        : imageUrls.length === 1
          ? '📷 1 ảnh'
          : `📷 ${imageUrls.length} ảnh`;
      await this.conservationsService.touchLastMessage(conversationId, preview, saved.sent_at);

      const populated = await this.messageModel
        .findById(saved._id)
        .populate('sender_id', 'name avatar_url')
        .populate('receiver_id', 'name avatar_url')
        .exec();
      return populated || (saved as any);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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
        .populate('sender_id', 'name avatar_url')
        .populate('receiver_id', 'name avatar_url')
        .sort({ sent_at: 1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding messages: ${error.message}`);
    }
  }

  async findByConversation(conversationId: string, currentUserId: string): Promise<Message[]> {
    return this.findByConversationPaged(conversationId, currentUserId);
  }

  async findByConversationPaged(
    conversationId: string,
    currentUserId: string,
    limit = 20,
    before?: string,
  ): Promise<Message[]> {
    const conversation = await this.conservationsService.findOne(conversationId);
    if (!this.conservationsService.isParticipant(conversation, currentUserId)) {
      throw new BadRequestException('Bạn không thuộc cuộc hội thoại này');
    }

    try {
      const filter: any = { conversation_id: conversationId };
      if (before) {
        const date = new Date(before);
        if (!isNaN(date.getTime())) {
          filter.sent_at = { $lt: date };
        }
      }

      const docs = await this.messageModel
        .find(filter)
        .populate('sender_id', 'name avatar_url')
        .populate('receiver_id', 'name avatar_url')
        .sort({ sent_at: -1 })
        .limit(limit)
        .exec();

      // Trả về theo thứ tự thời gian tăng dần
      return docs.reverse();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding messages: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Message> {
    try {
      const message = await this.messageModel
        .findById(id)
        .populate('sender_id', 'name avatar_url')
        .populate('receiver_id', 'name avatar_url')
        .exec();
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
      const conversation = await this.conservationsService.findOne(conversationId);
      if (!this.conservationsService.isParticipant(conversation, userId)) {
        throw new BadRequestException('Bạn không thuộc cuộc hội thoại này');
      }
      await this.messageModel.updateMany(
        { conversation_id: conversationId, receiver_id: userId, is_read: false },
        { is_read: true, read_at: new Date() },
      ).exec();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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
