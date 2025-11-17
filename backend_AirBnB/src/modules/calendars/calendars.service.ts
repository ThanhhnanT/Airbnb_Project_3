import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Calendar, CalendarDocument } from './schemas/calendar.schema';
import { Model } from 'mongoose';

@Injectable()
export class CalendarsService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
  ) {}

  async create(createCalendarDto: CreateCalendarDto): Promise<Calendar> {
    try {
      const createdCalendar = new this.calendarModel(createCalendarDto);
      return await createdCalendar.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating calendar: ${error.message}`);
    }
  }

  async findAll(listingId?: string): Promise<Calendar[]> {
    try {
      const filter = listingId ? { listing_id: listingId } : {};
      return await this.calendarModel.find(filter).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding calendars: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Calendar> {
    try {
      const calendar = await this.calendarModel.findById(id).exec();
      if (!calendar) {
        throw new NotFoundException(`Calendar with ID ${id} not found`);
      }
      return calendar;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding calendar: ${error.message}`);
    }
  }

  async update(id: string, updateCalendarDto: UpdateCalendarDto): Promise<Calendar> {
    try {
      const updatedCalendar = await this.calendarModel
        .findByIdAndUpdate(id, updateCalendarDto, { new: true })
        .exec();
      if (!updatedCalendar) {
        throw new NotFoundException(`Calendar with ID ${id} not found`);
      }
      return updatedCalendar;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating calendar: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.calendarModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Calendar with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting calendar: ${error.message}`);
    }
  }
}
