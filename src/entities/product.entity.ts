import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ProductSale } from './product-sale.entity';
import { ReturnProducts } from './return-products.entity';

@Table
export class Product extends Model<Product> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  code: number;

  @Column(DataType.STRING)
  name: string;

  @HasMany(() => ProductSale)
  productSales: ProductSale[];

  @HasMany(() => ReturnProducts)
  returnProducts: ReturnProducts[];

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
