import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/auth/entities/user.entity';
import { Message } from './message.entity';

@Table
export class MessagesPoll extends Model<MessagesPoll> {
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => Message)
  message: Message[];

  @Column
  name: string;
}
