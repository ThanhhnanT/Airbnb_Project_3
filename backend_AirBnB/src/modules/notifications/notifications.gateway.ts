import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Get token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      // JWT payload contains 'sud' (user id) and 'email' based on auth.service.ts
      let userId = payload.sud || payload.id || payload.user_id || payload.sub;
      // Normalize userId to string for consistency
      if (userId) {
        userId = userId.toString();
      }
      // Token hiện không chứa role -> lấy role từ DB
      let userRole: string | undefined;
      try {
        const user = userId ? await this.userModel.findById(userId).select('role _id').lean().exec() : null;
        userRole = (user as any)?.role?.type;
        // Ensure userId matches DB _id format
        if (user && (user as any)?._id) {
          userId = (user as any)._id.toString();
        }
      } catch (roleError) {
        this.logger.warn(`Could not load user role for ${userId}: ${String((roleError as any)?.message || roleError)}`);
      }
      this.logger.log(`Token verified - userId: ${userId}, email: ${payload.email}, role: ${userRole}`);

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      // Store connection
      this.connectedUsers.set(client.id, userId);

      // Join appropriate rooms
      if (userRole === 'admin') {
        client.join('admin');
        this.logger.log(`[CONNECTION] Admin ${userId} connected (socket: ${client.id}) - joined room: admin`);
      } else if (userRole === 'host') {
        const hostRoom = `host_${userId}`;
        client.join(hostRoom);
        this.logger.log(`[CONNECTION] Host ${userId} connected (socket: ${client.id}) - joined room: ${hostRoom}`);
        
        // Verify room join - try different adapter access methods
        try {
          const adapter = (this.server as any).sockets?.adapter || (this.server as any).adapter;
          if (adapter && adapter.rooms) {
            const room = adapter.rooms.get(hostRoom);
            this.logger.log(`[CONNECTION] Host room ${hostRoom} now has ${room ? room.size : 0} client(s)`);
            
            // List all host rooms for debugging
            const allRooms = Array.from(adapter.rooms.keys());
            const hostRooms = allRooms.filter((r: string) => r.startsWith('host_'));
            this.logger.log(`[CONNECTION] All host rooms currently: ${hostRooms.join(', ')}`);
          }
        } catch (error) {
          this.logger.warn(`[CONNECTION] Could not verify room join: ${error}`);
        }
      } else {
        client.join(`user_${userId}`);
        this.logger.log(`[CONNECTION] User ${userId} connected (socket: ${client.id}) - joined room: user_${userId}`);
      }

      // Send welcome message
      client.emit('connected', { message: 'Connected to notification server' });
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

  // Send notification to admin
  sendToAdmin(event: string, data: any) {
    this.server.to('admin').emit(event, data);
    this.logger.log(`Sent ${event} to admin room`);
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
    this.logger.log(`Sent ${event} to user ${userId}`);
  }

  // Send notification to specific host
  sendToHost(hostId: string, event: string, data: any) {
    const room = `host_${hostId}`;
    
    // Check if server is available
    if (!this.server) {
      this.logger.error(`[NOTIFICATION] Cannot send ${event}: server not available`);
      return;
    }
    
    // Try to get client count - adapter might not be available immediately
    let clientCount = 0;
    try {
      // Try different ways to access adapter
      const adapter = (this.server as any).sockets?.adapter || (this.server as any).adapter;
      if (adapter && adapter.rooms) {
        const clientsInRoom = adapter.rooms.get(room);
        clientCount = clientsInRoom ? clientsInRoom.size : 0;
        
        // Log all connected rooms for debugging
        try {
          const allRooms = Array.from(adapter.rooms.keys());
          const hostRooms = allRooms.filter((r: string) => r.startsWith('host_'));
          this.logger.log(`[NOTIFICATION] All host rooms: ${hostRooms.join(', ')}`);
        } catch (error) {
          // Ignore error when listing rooms
        }
      }
    } catch (error) {
      this.logger.warn(`[NOTIFICATION] Could not get client count: ${error}`);
    }
    
    this.logger.log(`[NOTIFICATION] Sending ${event} to room ${room} (hostId: ${hostId}, ${clientCount} client(s) connected)`);
    this.logger.log(`[NOTIFICATION] Event data:`, JSON.stringify(data, null, 2));
    
    if (clientCount === 0) {
      this.logger.warn(`[NOTIFICATION] ⚠️ WARNING: No clients in room ${room}. Host ${hostId} may not be connected.`);
      this.logger.warn(`[NOTIFICATION] ⚠️ Make sure host with ID ${hostId} is logged in and socket is connected.`);
    }
    
    // Send notification regardless of client count (socket.io will handle it)
    this.server.to(room).emit(event, data);
    this.logger.log(`[NOTIFICATION] ✅ Sent ${event} to host ${hostId} in room ${room}`);
  }

  // Send notification to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: 'pong' };
  }
}
