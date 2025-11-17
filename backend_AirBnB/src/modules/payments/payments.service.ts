import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schemas';
import { Model } from 'mongoose';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      const createdPayment = new this.paymentModel(createPaymentDto);
      return await createdPayment.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating payment: ${error.message}`);
    }
  }

  async findAll(bookingId?: string, userId?: string): Promise<Payment[]> {
    try {
      const filter: any = {};
      if (bookingId) filter.booking_id = bookingId;
      if (userId) filter.user_id = userId;
      return await this.paymentModel.find(filter).populate('booking_id user_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding payments: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(id).populate('booking_id user_id').exec();
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding payment: ${error.message}`);
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      const updatedPayment = await this.paymentModel
        .findByIdAndUpdate(id, updatePaymentDto, { new: true })
        .exec();
      if (!updatedPayment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return updatedPayment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating payment: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.paymentModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting payment: ${error.message}`);
    }
  }
}
