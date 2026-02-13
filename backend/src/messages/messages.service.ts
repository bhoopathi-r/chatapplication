import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) {}

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.messagesRepository.create(messageData);
    const savedMessage = await this.messagesRepository.save(message);
    
    // Update conversation's last_message_at
    if (savedMessage.conversation_id) {
      await this.conversationsRepository.update(savedMessage.conversation_id, {
        last_message_at: savedMessage.created_at,
      });
    }

    return savedMessage;
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
