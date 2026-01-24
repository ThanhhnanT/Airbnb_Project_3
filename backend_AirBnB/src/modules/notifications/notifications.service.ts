import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const createdNotification = new this.notificationModel(createNotificationDto);
      return await createdNotification.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating notification: ${error.message}`);
    }
  }

  async findAll(userId?: string, unreadOnly?: boolean): Promise<Notification[]> {
    try {
      const filter: any = {};
      if (userId) filter.user_id = userId;
      if (unreadOnly) filter.is_read = false;
      return await this.notificationModel.find(filter).sort({ created_at: -1 }).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding notifications: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id).exec();
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding notification: ${error.message}`);
    }
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    try {
      const updatedNotification = await this.notificationModel
        .findByIdAndUpdate(id, updateNotificationDto, { new: true })
        .exec();
      if (!updatedNotification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      return updatedNotification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating notification: ${error.message}`);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationModel.updateMany(
        { user_id: userId, is_read: false },
        { is_read: true }
      ).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error marking notifications as read: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.notificationModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting notification: ${error.message}`);
    }
  }

  async createCheckoutNotification(
    hostId: string,
    bookingId: string,
    guestName: string,
    listingTitle: string,
  ): Promise<Notification> {
    try {
      const notification = new this.notificationModel({
        user_id: hostId,
        type: 'checkout_completed',
        message: `Chúc mừng! Chuyến đi của khách ${guestName} tại "${listingTitle}" đã hoàn thành. Vui lòng để lại đánh giá cho khách hàng.`,
        link_action: `/reviews/write/${bookingId}`,
        booking_id: bookingId,
        is_read: false,
      });
      return await notification.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating checkout notification: ${error.message}`);
    }
  }

  async findCheckoutNotificationForBooking(userId: string, bookingId: string): Promise<Notification | null> {
    try {
      return await this.notificationModel.findOne({
        user_id: userId,
        booking_id: bookingId,
        type: 'checkout_completed',
      }).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding checkout notification: ${error.message}`);
    }
  }
}
