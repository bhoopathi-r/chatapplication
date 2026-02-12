import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) {}

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
    return this.conversationsRepository.find({
      where: [
        { user1_id: userId },
        { user2_id: userId },
      ],
      relations: ['user1', 'user2'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: number): Promise<Conversation | null> {
    return this.conversationsRepository.findOne({
      where: { id },
      relations: ['user1', 'user2'],
    });
  }
}
