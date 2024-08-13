import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
}
