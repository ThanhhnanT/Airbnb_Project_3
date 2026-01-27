import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.messagesService.createForUser(userId?.toString(), createMessageDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: any,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limitStr?: string,
    @Query('before') before?: string,
  ) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    if (conversationId) {
      const limit = limitStr ? parseInt(limitStr, 10) || 20 : 20;
      return this.messagesService.findByConversationPaged(conversationId, userId?.toString(), limit, before);
    }
    return this.messagesService.findAll(undefined, userId?.toString());
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard)
  markRead(@Body('conversationId') conversationId: string, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.messagesService.markAsRead(conversationId, userId?.toString());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
