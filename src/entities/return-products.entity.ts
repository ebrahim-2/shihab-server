import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Return } from './return.entity';
import { Product } from './product.entity';

@Table
export class ReturnProducts extends Model<ReturnProducts> {
  @ForeignKey(() => Return)
  @Column(DataType.STRING)
  returnId: string;

  @BelongsTo(() => Return)
  return_: Return;

  @ForeignKey(() => Product)
  @Column(DataType.INTEGER)
  itemId: number;

  @BelongsTo(() => Product)
  item: Product;

  @Column(DataType.STRING)
  batchNumber: string;

  @Column(DataType.DATE)
  expiryDate: Date;

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

  @Column(DataType.INTEGER)
  returnSkuQty: number | null;
}
