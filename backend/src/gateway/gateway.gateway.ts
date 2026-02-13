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
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // conversationId:userId -> timeout

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) { }

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

      // Broadcast to all clients that this user is online
      this.server.emit('userOnline', userId);

      // Send the list of all currently online users to the newly connected client
      const onlineUserIds = Array.from(this.connectedUsers.keys());
      client.emit('onlineUsers', onlineUserIds);

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
    @MessageBody() data: { conversationId: number; receiverId: number; content: string; replyToId?: number },
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) return;

    const message = await this.messagesService.create({
      conversation_id: data.conversationId,
      sender_id: senderId,
      receiver_id: data.receiverId,
      content: data.content,
      reply_to_id: data.replyToId,
    });

    const conversationUpdatePayload = {
      conversationId: data.conversationId,
      last_message_at: message.created_at,
    };

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('receiveMessage', message);
      this.server.to(receiverSocketId).emit('conversationUpdated', conversationUpdatePayload);
    }

    // Always emit back to sender (or handle in frontend)
    client.emit('messageSent', message);
    client.emit('conversationUpdated', conversationUpdatePayload);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; receiverId: number },
  ) {
    const senderId = this.getUserId(client);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);

    console.log('Typing event received:', { senderId, receiverId: data.receiverId, conversationId: data.conversationId, receiverSocketId });

    if (receiverSocketId && senderId) {
      // Clear any existing timeout for this user in this conversation
      const timeoutKey = `${data.conversationId}:${senderId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey));
      }

      // Emit typing event
      this.server.to(receiverSocketId).emit('typing', {
        conversationId: data.conversationId,
        userId: senderId,
      });
      console.log('Emitted typing event to receiver:', { receiverSocketId, senderId, conversationId: data.conversationId });

      // Set timeout to auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.server.to(receiverSocketId).emit('stopTyping', {
          conversationId: data.conversationId,
          userId: senderId,
        });
        this.typingTimeouts.delete(timeoutKey);
        console.log('Auto-stopped typing after timeout:', { senderId, conversationId: data.conversationId });
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; receiverId: number },
  ) {
    const senderId = this.getUserId(client);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);

    if (receiverSocketId && senderId) {
      // Clear the timeout if it exists
      const timeoutKey = `${data.conversationId}:${senderId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey));
        this.typingTimeouts.delete(timeoutKey);
      }

      this.server.to(receiverSocketId).emit('stopTyping', {
        conversationId: data.conversationId,
        userId: senderId,
      });
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number; receiverId: number; content: string },
  ) {
    const message = await this.messagesService.update(data.id, data.content);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messageEdited', message);
    }
    client.emit('messageEdited', message);
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number; receiverId: number; deleteForEveryone: boolean },
  ) {
    if (data.deleteForEveryone) {
      await this.messagesService.deleteForEveryone(data.id);
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('messageDeleted', { id: data.id, deleteForEveryone: true });
      }
      client.emit('messageDeleted', { id: data.id, deleteForEveryone: true });
    } else {
      await this.messagesService.deleteForMe(data.id);
      client.emit('messageDeleted', { id: data.id, deleteForEveryone: false });
    }
  }

  @SubscribeMessage('pinMessage')
  async handlePinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number; receiverId: number; isPinned: boolean },
  ) {
    const message = await this.messagesService.setPinned(data.id, data.isPinned);
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('messagePinned', message);
    }
    client.emit('messagePinned', message);
  }

  @SubscribeMessage('clearChat')
  async handleClearChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = this.getUserId(client);
    if (userId) {
      await this.messagesService.clearChat(data.conversationId, userId);
      client.emit('chatCleared', { conversationId: data.conversationId });
    }
  }

  @SubscribeMessage('searchMessages')
  async handleSearchMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; query: string },
  ) {
    const messages = await this.messagesService.searchMessages(data.conversationId, data.query);
    client.emit('searchResults', { messages });
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
