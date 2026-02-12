import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
  },
})
export class GatewayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.connectedUsers.set(userId, client.id);
      await this.usersService.updateStatus(userId, 'online');
      
      this.server.emit('userOnline', userId);
      console.log(`Client connected: ${userId}`);
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        await this.usersService.updateStatus(userId, 'offline');
        this.server.emit('userOffline', userId);
        console.log(`Client disconnected: ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; receiverId: number; content: string },
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) return;

    const message = await this.messagesService.create({
      conversation_id: data.conversationId,
      sender_id: senderId,
      receiver_id: data.receiverId,
      content: data.content,
    });

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receiveMessage', message);
    }
    
    // Always emit back to sender (or handle in frontend)
    client.emit('messageSent', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; receiverId: number },
  ) {
    const senderId = this.getUserId(client);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing', {
        conversationId: data.conversationId,
        userId: senderId,
      });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; receiverId: number },
  ) {
    const senderId = this.getUserId(client);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('stopTyping', {
        conversationId: data.conversationId,
        userId: senderId,
      });
    }
  }

  private getUserId(client: Socket): number | null {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        return userId;
      }
    }
    return null;
  }
}
