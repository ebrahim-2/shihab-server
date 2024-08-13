import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { SaleItem } from './sale-item.entity';
import { ReturnItem } from './return-item.entity';

@Table
export class Item extends Model<Item> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  code: number;

  @Column(DataType.STRING)
  name: string;

  @HasMany(() => SaleItem)
  saleItems: SaleItem[];

  @HasMany(() => ReturnItem)
  returnItems: ReturnItem[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  salesCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  returnsCount: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  monthlySales: Record<string, number>;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  monthlyReturns: Record<string, number>;

  @Column(DataType.DATEONLY)
  lastSaleDate: Date;

  @Column(DataType.DATEONLY)
  lastReturnDate: Date;
}
