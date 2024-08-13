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
import { Sale } from './sale.entity';
import { ReturnProducts } from './return-products.entity';

@Table
export class Return extends Model<Return> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  returnCode: string;

  @Column({
    type: DataType.DATE,
  })
  returnDateTime: Date;

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

  @HasMany(() => ReturnProducts)
  items: ReturnProducts[];

  @ForeignKey(() => Sale)
  @Column(DataType.STRING)
  originalInvoiceId: string;

  @BelongsTo(() => Sale)
  originalInvoice: Sale;

  @Column(DataType.STRING)
  currency: string;

  @Column(DataType.STRING)
  type: string;

  @Column({
    type: DataType.INTEGER,
  })
  totalAmount: number;
}
