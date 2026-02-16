import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) { }

  async findOrCreate(user1Id: number, user2Id: number): Promise<Conversation> {
    let conversation = await this.conversationsRepository.findOne({
      where: [
        { user1_id: user1Id, user2_id: user2Id },
        { user1_id: user2Id, user2_id: user1Id },
      ],
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      const newConversation = this.conversationsRepository.create({
        user1_id: user1Id,
        user2_id: user2Id,
      });
      const savedConversation = await this.conversationsRepository.save(newConversation);
      // Reload to get relations
      conversation = (await this.conversationsRepository.findOne({
        where: { id: savedConversation.id },
        relations: ['user1', 'user2'],
      }))!;
    }

    return conversation;
  }

  async findByUser(userId: number): Promise<Conversation[]> {
    const conversations = await this.conversationsRepository.find({
      where: [
        { user1_id: userId },
        { user2_id: userId },
      ],
      relations: ['user1', 'user2'],
      order: { last_message_at: 'DESC' },
    });

    // Fetch the last message and unread count for each conversation
    for (const conversation of conversations) {
      const lastMessage = await this.conversationsRepository.manager
        .getRepository(Message)
        .createQueryBuilder('message')
        .where('message.conversation_id = :conversationId', { conversationId: conversation.id })
        .orderBy('message.created_at', 'DESC')
        .getOne();

      if (lastMessage) {
        (conversation as any).lastMessage = lastMessage;
      }

      const unreadCount = await this.conversationsRepository.manager
        .getRepository(Message)
        .count({
          where: {
            conversation_id: conversation.id,
            receiver_id: userId,
            is_read: false,
          },
        });
      (conversation as any).unreadCount = unreadCount;
    }

    return conversations;
  }

  async findById(id: number): Promise<Conversation | null> {
    return this.conversationsRepository.findOne({
      where: { id },
      relations: ['user1', 'user2'],
    });
  }

  async updateLastMessageAt(conversationId: number, date: Date = new Date()): Promise<void> {
    await this.conversationsRepository.update(conversationId, {
      last_message_at: date,
    });
  }
}
