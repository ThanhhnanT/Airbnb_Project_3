import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('host/my-bookings')
  @ApiOperation({ summary: 'Lấy danh sách bookings của host hiện tại' })
  getHostBookings(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bookingsService.findHostBookings(userId, status);
  }

  @Get('host/listing-counts')
  @ApiOperation({ summary: 'Lấy số lượng đơn đặt theo listing cho host' })
  getListingCounts(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bookingsService.countBookingsByListingForHost(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
