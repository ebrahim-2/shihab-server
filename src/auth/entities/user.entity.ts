import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { MessagesPoll } from 'src/entities/message-poll.entity';

@Table
export class User extends Model<User> {
  @Column
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email: string;

  @Column
  password: string;

  @Column
  token: string;

  @HasMany(() => MessagesPoll)
  messagesPoll: MessagesPoll[];
}
