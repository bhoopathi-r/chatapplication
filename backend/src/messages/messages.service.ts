import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) { }

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

  async findByConversation(conversationId: number, userId: number): Promise<Message[]> {
    const conversation = await this.conversationsRepository.findOne({ where: { id: conversationId } });
    if (!conversation) return [];

    const clearedAt = conversation.user1_id === userId ? conversation.user1_cleared_at : conversation.user2_cleared_at;

    const query = this.messagesRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.conversation_id = :conversationId', { conversationId })
      .orderBy('message.created_at', 'ASC');

    if (clearedAt) {
      query.andWhere('message.created_at > :clearedAt', { clearedAt });
    }

    return query.getMany();
  }

  async markAsRead(conversationId: number, receiverId: number): Promise<void> {
    await this.messagesRepository.update(
      { conversation_id: conversationId, receiver_id: receiverId, is_read: false },
      { is_read: true },
    );
  }

  async update(id: number, content: string): Promise<Message> {
    await this.messagesRepository.update(id, { content, is_edited: true });
    return (await this.messagesRepository.findOne({ where: { id } })) as Message;
  }

  async setPinned(id: number, isPinned: boolean): Promise<Message> {
    await this.messagesRepository.update(id, { is_pinned: isPinned });
    return (await this.messagesRepository.findOne({ where: { id } })) as Message;
  }

  async deleteForEveryone(id: number): Promise<void> {
    await this.messagesRepository.update(id, { content: 'This message was deleted', is_deleted_everyone: true });
  }

  async deleteForMe(id: number): Promise<void> {
    await this.messagesRepository.delete(id);
  }

  async clearChat(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.conversationsRepository.findOne({ where: { id: conversationId } });
    if (!conversation) return;

    if (conversation.user1_id === userId) {
      await this.conversationsRepository.update(conversationId, { user1_cleared_at: () => 'CURRENT_TIMESTAMP' });
    } else if (conversation.user2_id === userId) {
      await this.conversationsRepository.update(conversationId, { user2_cleared_at: () => 'CURRENT_TIMESTAMP' });
    }
  }

  async searchMessages(conversationId: number, query: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: {
        conversation_id: conversationId,
        content: Like(`%${query}%`),
      },
      order: { created_at: 'ASC' },
    });
  }
}
