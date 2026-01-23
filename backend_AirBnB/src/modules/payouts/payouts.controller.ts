import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payouts')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  create(@Body() createPayoutDto: CreatePayoutDto) {
    return this.payoutsService.create(createPayoutDto);
  }

  @Get()
  findAll() {
    return this.payoutsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payoutsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayoutDto: UpdatePayoutDto) {
    return this.payoutsService.update(id, updatePayoutDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payoutsService.remove(id);
  }

  @Get('host/:hostId')
  @ApiOperation({ summary: 'Lấy danh sách payouts của host' })
  async findHostPayouts(
    @Param('hostId') hostId: string,
    @Query('status') status?: string,
  ) {
    return this.payoutsService.findHostPayouts(hostId, status);
  }

  @Get('host/:hostId/stats')
  @ApiOperation({ summary: 'Thống kê payouts của host' })
  async getHostPayoutStats(@Param('hostId') hostId: string) {
    return this.payoutsService.getPayoutStats(hostId);
  }

  @Get('my-payouts')
  @ApiOperation({ summary: 'Lấy payouts của host hiện tại' })
  async getMyPayouts(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    const hostId = req.user?.id || req.user?.user_id;
    return this.payoutsService.findHostPayouts(hostId, status);
  }

  @Get('my-payouts/stats')
  @ApiOperation({ summary: 'Thống kê payouts của host hiện tại' })
  async getMyPayoutStats(@Req() req: any) {
    const hostId = req.user?.id || req.user?.user_id;
    return this.payoutsService.getPayoutStats(hostId);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Admin đánh dấu payout đã được chuyển tiền' })
  async markPayoutAsPaid(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    const adminId = req.user?.id || req.user?.user_id;
    return this.payoutsService.markAsPaid(id, adminId, body.note);
  }
}
