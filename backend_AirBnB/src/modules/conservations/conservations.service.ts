import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation, ConversationDocument } from './schemas/conservation.schema';
import { Model } from 'mongoose';

@Injectable()
export class ConservationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  async create(createConservationDto: CreateConservationDto): Promise<Conversation> {
    try {
      const createdConversation = new this.conversationModel(createConservationDto);
      return await createdConversation.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating conversation: ${error.message}`);
    }
  }

  async findAll(): Promise<Conversation[]> {
    try {
      return await this.conversationModel.find().sort({ last_updated: -1 }).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding conversations: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Conversation> {
    try {
      const conversation = await this.conversationModel.findById(id).exec();
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
