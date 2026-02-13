import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @UseGuards(JwtAuthGuard)
  @Get(':conversationId')
  async getMessages(@Param('conversationId') conversationId: number, @Request() req: any) {
    return this.messagesService.findByConversation(conversationId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('read/:conversationId')
  async markAsRead(@Param('conversationId') conversationId: number, @Request() req: any) {
    await this.messagesService.markAsRead(conversationId, req.user.userId);
    return { success: true };
  }
}
