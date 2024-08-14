import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/auth/entities/user.entity';
import { MessagesPoll } from './message-poll.entity';

@Table
export class Message extends Model<Message> {
  @Column(DataType.TEXT)
  message: string;

  @ForeignKey(() => MessagesPoll)
  @Column
  messagePollId: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  assistant: boolean;
}
