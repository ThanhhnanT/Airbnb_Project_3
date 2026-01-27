import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ConservationsService } from './conservations.service';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@Controller('conservations')
export class ConservationsController {
  constructor(private readonly conservationsService: ConservationsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.conservationsService.findMine(userId?.toString());
  }

  @Get('by-booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  getOrCreateByBooking(@Param('bookingId') bookingId: string, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.conservationsService.createFromBooking(bookingId, userId?.toString());
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createConservationDto: CreateConservationDto, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.conservationsService.create(createConservationDto, userId?.toString());
  }

  @Get()
  findAll() {
    return this.conservationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conservationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConservationDto: UpdateConservationDto) {
    return this.conservationsService.update(id, updateConservationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conservationsService.remove(id);
  }
}
