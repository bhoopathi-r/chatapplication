import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userData.password_hash!, salt);

    const user = this.usersRepository.create({
      ...userData,
      password_hash: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async search(query: string, currentUserId: number): Promise<User[]> {
    return this.usersRepository.createQueryBuilder('user')
      .where('user.id != :id', { id: currentUserId })
      .andWhere('(user.name ILIKE :query OR user.email ILIKE :query)', { query: `%${query}%` })
      .select(['user.id', 'user.name', 'user.email', 'user.avatar_url', 'user.status', 'user.last_seen'])
      .getMany();
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.usersRepository.update(id, {
      status,
      last_seen: new Date(),
    });
  }

  async findAllExcept(id: number): Promise<User[]> {
    return this.usersRepository.createQueryBuilder('user')
      .where('user.id != :id', { id })
      .select(['user.id', 'user.name', 'user.email', 'user.avatar_url', 'user.status', 'user.last_seen'])
      .getMany();
  }
}
