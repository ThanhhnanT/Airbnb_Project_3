import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payout, PayoutDocument } from './schemas/payout.schema';
import { Model } from 'mongoose';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
  ) {}

  async create(createPayoutDto: CreatePayoutDto): Promise<Payout> {
    try {
      const createdPayout = new this.payoutModel(createPayoutDto);
      return await createdPayout.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating payout: ${error.message}`);
    }
  }

  async findAll(hostId?: string): Promise<Payout[]> {
    try {
      const filter = hostId ? { host_id: hostId } : {};
      return await this.payoutModel.find(filter).populate('host_id booking_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding payouts: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Payout> {
    try {
      const payout = await this.payoutModel.findById(id).populate('host_id booking_id').exec();
      if (!payout) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
      return payout;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding payout: ${error.message}`);
    }
  }

  async update(id: string, updatePayoutDto: UpdatePayoutDto): Promise<Payout> {
    try {
      const updatedPayout = await this.payoutModel
        .findByIdAndUpdate(id, updatePayoutDto, { new: true })
        .exec();
      if (!updatedPayout) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
      return updatedPayout;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating payout: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.payoutModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting payout: ${error.message}`);
    }
  }
}
