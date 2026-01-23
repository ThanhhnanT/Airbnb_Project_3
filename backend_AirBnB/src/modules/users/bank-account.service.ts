import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BankAccount, BankAccountDocument } from './schemas/bank-account.schema';
import { Model } from 'mongoose';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
  ) {}

  async create(userId: string, createBankAccountDto: CreateBankAccountDto): Promise<BankAccountDocument> {
    try {
      // Check if user already has a primary bank account
      const existingAccount = await this.bankAccountModel.findOne({
        user_id: userId,
        is_primary: true,
      }).exec();

      // If creating primary account and one already exists, set existing to non-primary
      if (createBankAccountDto.is_primary !== false && existingAccount) {
        await this.bankAccountModel.findByIdAndUpdate(existingAccount._id, {
          is_primary: false,
        }).exec();
      }

      const bankAccount = new this.bankAccountModel({
        ...createBankAccountDto,
        user_id: userId,
        is_primary: createBankAccountDto.is_primary !== false, // Default to true
      });

      return await bankAccount.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating bank account: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<BankAccountDocument | null> {
    try {
      return await this.bankAccountModel
        .findOne({ user_id: userId, is_primary: true })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding bank account: ${error.message}`);
    }
  }

  async findAllByUserId(userId: string): Promise<BankAccountDocument[]> {
    try {
      return await this.bankAccountModel
        .find({ user_id: userId })
        .sort({ is_primary: -1, createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding bank accounts: ${error.message}`);
    }
  }

  async findOne(id: string, userId?: string): Promise<BankAccountDocument> {
    try {
      const filter: any = { _id: id };
      if (userId) {
        filter.user_id = userId; // Ensure user can only access their own accounts
      }

      const bankAccount = await this.bankAccountModel.findOne(filter).exec();
      if (!bankAccount) {
        throw new NotFoundException(`Bank account with ID ${id} not found`);
      }
      return bankAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding bank account: ${error.message}`);
    }
  }

  async update(id: string, userId: string, updateBankAccountDto: UpdateBankAccountDto): Promise<BankAccountDocument> {
    try {
      // Verify ownership
      const bankAccount = await this.findOne(id, userId);

      // If setting as primary, unset other primary accounts
      if (updateBankAccountDto.is_primary === true) {
        await this.bankAccountModel.updateMany(
          { user_id: userId, _id: { $ne: id }, is_primary: true },
          { is_primary: false },
        ).exec();
      }

      const updatedAccount = await this.bankAccountModel
        .findByIdAndUpdate(id, updateBankAccountDto, { new: true })
        .exec();

      if (!updatedAccount) {
        throw new NotFoundException(`Bank account with ID ${id} not found`);
      }

      return updatedAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating bank account: ${error.message}`);
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      await this.findOne(id, userId);

      const result = await this.bankAccountModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Bank account with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting bank account: ${error.message}`);
    }
  }

  async verify(id: string): Promise<BankAccountDocument> {
    try {
      const bankAccount = await this.bankAccountModel.findByIdAndUpdate(
        id,
        { is_verified: true },
        { new: true },
      ).exec();

      if (!bankAccount) {
        throw new NotFoundException(`Bank account with ID ${id} not found`);
      }

      return bankAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error verifying bank account: ${error.message}`);
    }
  }
}
