import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Sale } from './sale.entity';
import { Return } from './return.entity';
import { Collection } from './collection.entity';

@Table
export class Salesman extends Model<Salesman> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  code: number;

  @Column(DataType.STRING)
  name: string;

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
  totalSalesAmount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalSalesCount: number;
}
