import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto, ApproveRefundDto, RejectRefundDto } from './dto/create-refund.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @ApiOperation({ summary: 'Guest yêu cầu hoàn tiền' })
  requestRefund(@Body() createRefundDto: CreateRefundDto, @Req() req: any) {
    const guestId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!guestId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    const guestIdStr = typeof guestId === 'string' ? guestId : guestId.toString();
    console.log('[RefundsController] requestRefund - guestId:', guestIdStr);
    return this.refundsService.requestRefund(createRefundDto, guestIdStr);
  }

  @Get('my-refunds')
  @ApiOperation({ summary: 'Lấy danh sách hoàn tiền của guest' })
  getMyRefunds(@Req() req: any) {
    const guestId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!guestId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    return this.refundsService.getGuestRefunds(guestId);
  }

  @Get('host/my-refunds')
  @ApiOperation({ summary: 'Lấy danh sách hoàn tiền của host' })
  getHostRefunds(@Req() req: any, @Query('status') status?: string) {
    const hostId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!hostId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    const hostIdStr = typeof hostId === 'string' ? hostId : hostId.toString();
    console.log('[RefundsController] getHostRefunds - hostId:', hostIdStr, 'status:', status);
    return this.refundsService.getHostRefunds(hostIdStr, status);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Lấy danh sách hoàn tiền đang chờ xử lý (Admin)' })
  getPendingRefunds() {
    return this.refundsService.getPendingRefunds();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê hoàn tiền' })
  getRefundStats() {
    return this.refundsService.getRefundStats();
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hoàn tiền (Admin or Host)' })
  getAllRefunds(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    const userRole = req.user?.role?.type || req.user?.role;
    
    // If user is a host, return only their refunds
    if (userRole === 'host' && userId) {
      const hostIdStr = typeof userId === 'string' ? userId : userId.toString();
      return this.refundsService.getHostRefunds(hostIdStr, status);
    }
    
    // Otherwise return all refunds (admin only)
    return this.refundsService.getAllRefunds(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết hoàn tiền' })
  getRefund(@Param('id') id: string) {
    return this.refundsService.getRefundRequest(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Phê duyệt hoàn tiền (Admin)' })
  approveRefund(
    @Param('id') id: string,
    @Body() approveRefundDto: ApproveRefundDto,
    @Req() req: any,
  ) {
    const adminId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!adminId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    return this.refundsService.approveRefund(id, approveRefundDto, adminId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Từ chối hoàn tiền (Admin)' })
  rejectRefund(
    @Param('id') id: string,
    @Body() rejectRefundDto: RejectRefundDto,
    @Req() req: any,
  ) {
    const adminId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!adminId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    return this.refundsService.rejectRefund(id, rejectRefundDto, adminId);
  }

  @Patch(':id/confirm-by-host')
  @ApiOperation({ summary: 'Host xác nhận hoàn tiền' })
  confirmRefundAsHost(@Param('id') id: string, @Req() req: any) {
    const hostId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!hostId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    const hostIdStr = typeof hostId === 'string' ? hostId : hostId.toString();
    console.log('[RefundsController] confirmRefundAsHost - hostId:', hostIdStr);
    return this.refundsService.confirmRefundAsHost(id, hostIdStr);
  }
}
