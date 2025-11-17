import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Dispute, DisputeDocument } from './schemas/dispute.schema';
import { Model } from 'mongoose';

@Injectable()
export class DisputesService {
  constructor(
    @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
  ) {}

  async create(createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    try {
      const createdDispute = new this.disputeModel(createDisputeDto);
      return await createdDispute.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating dispute: ${error.message}`);
    }
  }

  async findAll(bookingId?: string, reporterId?: string): Promise<Dispute[]> {
    try {
      const filter: any = {};
      if (bookingId) filter.booking_id = bookingId;
      if (reporterId) filter.reporter_id = reporterId;
      return await this.disputeModel.find(filter).populate('booking_id reporter_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding disputes: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id).populate('booking_id reporter_id').exec();
      if (!dispute) {
        throw new NotFoundException(`Dispute with ID ${id} not found`);
      }
      return dispute;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding dispute: ${error.message}`);
    }
  }

  async update(id: string, updateDisputeDto: UpdateDisputeDto): Promise<Dispute> {
    try {
      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(id, updateDisputeDto, { new: true })
        .exec();
      if (!updatedDispute) {
        throw new NotFoundException(`Dispute with ID ${id} not found`);
      }
      return updatedDispute;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating dispute: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.disputeModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Dispute with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting dispute: ${error.message}`);
    }
  }
}
