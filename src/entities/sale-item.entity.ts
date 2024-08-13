import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Sale } from './sale.entity';
import { Item } from './item.entity';

@Table
export class SaleItem extends Model<SaleItem> {
  @ForeignKey(() => Sale)
  @Column(DataType.STRING)
  saleId: string;

  @BelongsTo(() => Sale)
  sale: Sale;

  @ForeignKey(() => Item)
  @Column(DataType.INTEGER)
  itemId: number;

  @BelongsTo(() => Item)
  item: Item;

  @Column(DataType.STRING)
  batchNumber: string;

  @Column(DataType.DATE)
  expiryDate: Date | null;

  @Column(DataType.INTEGER)
  bigQuantity: number | null;

  @Column(DataType.STRING)
  bigUnit: string | null;

  @Column(DataType.INTEGER)
  priceBig: number | null;

  @Column(DataType.INTEGER)
  mediumQuantity: number | null;

  @Column(DataType.STRING)
  mediumUnit: string | null;

  @Column(DataType.INTEGER)
  priceMedium: number | null;

  @Column(DataType.INTEGER)
  smallQuantity: number | null;

  @Column(DataType.STRING)
  smallUnit: string | null;

  @Column(DataType.INTEGER)
  priceSmall: number | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;
}
