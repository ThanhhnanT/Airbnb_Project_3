import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { ConservationsService } from '../conservations/conservations.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly conservationsService: ConservationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      let userId = payload.sud || payload.id || payload.user_id || payload.sub;
      if (userId) userId = userId.toString();

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, userId);
      const room = `user_${userId}`;
      client.join(room);
      client.emit('connected', { message: 'Connected to chat server' });
      this.logger.log(`[CONNECTION] User ${userId} connected (socket: ${client.id}) joined ${room}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.logger.log(`Client ${client.id} (user: ${userId}) disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId: string; receiverId: string; isTyping: boolean },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;
    if (!body?.receiverId) return;

    this.server.to(`user_${body.receiverId}`).emit('chat:typing', {
      conversationId: body.conversationId,
      senderId,
      isTyping: !!body.isTyping,
    });
  }

  @SubscribeMessage('chat:send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      conversationId: string;
      text?: string;
      image_urls?: string[];
      clientTempId?: string;
    },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    try {
      const saved = await this.messagesService.createForUser(senderId, {
        conversation_id: body.conversationId,
        content: body.text,
        image_urls: body.image_urls,
        client_temp_id: body.clientTempId,
      });

      // Determine receiver from conversation participants
      const conversation = await this.conservationsService.findOne(body.conversationId);
      const receiverId = this.conservationsService.getOtherParticipantId(conversation as any, senderId);

      // Ack sender to reconcile optimistic UI
      this.server.to(`user_${senderId}`).emit('chat:message_ack', {
        clientTempId: body.clientTempId,
        message: saved,
      });

      // Push to receiver
      this.server.to(`user_${receiverId}`).emit('chat:new_message', {
        message: saved,
      });

      // Also notify via /notifications bell for host or guest
      const anyConv: any = conversation as any;
      const normalizeId = (v: any): string => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (v._id) return String(v._id);
        return String(v);
      };
      const hostId = normalizeId(anyConv.host_id);
      const guestId = normalizeId(anyConv.guest_id);
      const preview =
        (body.text || '').slice(0, 120) ||
        (body.image_urls?.length ? `📷 ${body.image_urls.length} ảnh` : 'Tin nhắn mới');

      if (receiverId === hostId) {
        this.notificationsGateway.sendToHost(hostId, 'message_new', {
          conversation_id: body.conversationId,
          from_user_id: senderId,
          message_preview: preview,
          link_action: '/host/(dashboard)/messages',
        });
      } else if (receiverId === guestId) {
        this.notificationsGateway.sendToUser(guestId, 'message_new', {
          conversation_id: body.conversationId,
          from_user_id: senderId,
          message_preview: preview,
          link_action: '/messages',
        });
      }
    } catch (error: any) {
      this.server.to(`user_${senderId}`).emit('chat:error', {
        clientTempId: body?.clientTempId,
        message: error?.message || 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('chat:read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const readerId = this.connectedUsers.get(client.id);
    if (!readerId) return;

    try {
      await this.messagesService.markAsRead(body.conversationId, readerId);
      const conversation = await this.conservationsService.findOne(body.conversationId);
      const otherId = this.conservationsService.getOtherParticipantId(conversation as any, readerId);

      this.server.to(`user_${otherId}`).emit('chat:read', {
        conversationId: body.conversationId,
        readerId,
      });
    } catch (error) {
      // no-op
    }
  }
}

