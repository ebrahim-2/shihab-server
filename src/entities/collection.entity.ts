import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Customer } from './customer.entity';
import { Salesman } from './salesman.entity';

@Table
export class Collection extends Model<Collection> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  collectionCode: string;

  @Column(DataType.STRING)
  collectionType: string;

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

  @Column(DataType.STRING)
  location: string;

  @Column({
    type: DataType.DATE,
  })
  collectionDate: Date;

  @Column(DataType.DECIMAL(10, 2))
  amount: number;

  @Column(DataType.STRING)
  currency: string;

  @Column(DataType.STRING)
  settled: string;

  @Column(DataType.STRING)
  paymentType: string;
}
