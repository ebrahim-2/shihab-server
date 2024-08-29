import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Customer } from './customer.entity';
import { Salesman } from './salesman.entity';
import { ProductSale } from './product-sale.entity';

@Table
export class Sale extends Model<Sale> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  invoiceCode: string;

  @Column({
    type: DataType.DATE,
  })
  invoiceDateTime: Date;

  @ForeignKey(() => Customer)
  @Column(DataType.STRING)
  customerId: string;

  @BelongsTo(() => Customer)
  customer: Customer;

  @ForeignKey(() => Salesman)
  @Column(DataType.INTEGER)
  salesmanId: number;

  @BelongsTo(() => Salesman)
  salesman: Salesman;

  @HasMany(() => ProductSale)
  products: ProductSale[];

  @Column(DataType.INTEGER)
  discountAmount: number;

  @Column({
    type: DataType.INTEGER,
  })
  totalAmount: number;
}
