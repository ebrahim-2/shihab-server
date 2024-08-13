import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Sale } from './sale.entity';
import { Return } from './return.entity';
import { Collection } from './collection.entity';

@Table
export class Customer extends Model<Customer> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  code: string;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  area: string;

  @Column(DataType.STRING)
  address: string;

  @Column(DataType.STRING)
  phoneNumber: string;

  @HasMany(() => Sale)
  sales: Sale[];

  @HasMany(() => Return)
  returns: Return[];

  @HasMany(() => Collection)
  collections: Collection[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalPurchaseCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalPurchaseAmount: number;
}
