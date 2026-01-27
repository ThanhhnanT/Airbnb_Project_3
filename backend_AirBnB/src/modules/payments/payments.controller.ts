import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Headers, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll(@Query('bookingId') bookingId?: string, @Query('userId') userId?: string) {
    return this.paymentsService.findAll(bookingId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }

  @Post('process')
  @ApiOperation({ summary: 'Xử lý thanh toán với Stripe' })
  async processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.user_id;
    return this.paymentsService.processPayment(processPaymentDto, userId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString() || '';
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
