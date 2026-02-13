import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('blocks')
export class Block {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    blocker_id: number;

    @Column()
    blocked_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'blocker_id' })
    blocker: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'blocked_id' })
    blocked: User;

    @CreateDateColumn()
    created_at: Date;
}
