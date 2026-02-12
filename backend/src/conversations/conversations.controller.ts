import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyConversations(@Request() req: any) {
    return this.conversationsService.findByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConversation(@Body() body: { userId: number }, @Request() req: any) {
    return this.conversationsService.findOrCreate(req.user.userId, body.userId);
  }
}
