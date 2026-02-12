import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.messagesRepository.create(messageData);
    return this.messagesRepository.save(message);
  }

  async findByConversation(conversationId: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC' },
      relations: ['sender', 'receiver'],
    });
  }

  async markAsRead(conversationId: number, receiverId: number): Promise<void> {
    await this.messagesRepository.update(
      { conversation_id: conversationId, receiver_id: receiverId, is_read: false },
      { is_read: true },
    );
  }
}
