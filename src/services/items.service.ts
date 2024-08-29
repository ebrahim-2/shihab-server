import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { HelperService } from './helper.service';
import { ProductSale } from '../entities/product-sale.entity';
import { Sale } from '../entities/sale.entity';
import { Return } from 'src/entities/return.entity';
import { InjectModel } from '@nestjs/sequelize';
import { ReturnProducts } from 'src/entities/return-products.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Product)
    private itemModel: typeof Product,
    @InjectModel(ProductSale)
    private saleItemModel: typeof ProductSale,
    private helperService: HelperService,
    @InjectModel(ReturnProducts)
    private returnItemModel: typeof ReturnProducts,
  ) {}

  async updateMonthlySalesCount(item: Product, date: Date, count: number) {
    const monthKey = this.getMonthKey(date);
    // Initialize monthlySales as an empty object if it's undefined
    if (!item.monthlySales) {
      item.monthlySales = {};
    }

    item.monthlySales = {
      ...item.monthlySales,
      [monthKey]: (item.monthlySales[monthKey] || 0) + count,
    };

    item.lastSaleDate = date;

    await item.save();

    return item;
  }

  async updateMonthlyReturnCount(
    itemCode: number,
    date: Date,
    count: number,
  ): Promise<Product> {
    const item = await this.itemModel.findOne({
      where: { code: itemCode },
    });

    const monthKey = this.getMonthKey(date);

    item.monthlyReturns = {
      ...item.monthlyReturns,
      [monthKey]: (item.monthlyReturns[monthKey] || 0) + count,
    };

    item.lastReturnDate = date;

    await item.save();

    return item;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  async createSaleItem(row: any, sale: Sale): Promise<ProductSale> {
    const item = await this.getOrCreateItem(row);

    const saleItem = this.saleItemModel.create({
      saleId: sale.invoiceCode,
      productId: item.code,
      batchNumber: row['Batch Number'],
      expiryDate: this.helperService.parseDateDynamic(row['Expiry Date']),
      bigQuantity: this.helperService.parseFloatOrNull(row['Big Quantity']),
      bigUnit: this.helperService.parseStringOrNull(row['Big Unit']),
      priceBig: this.helperService.parseFloatOrNull(row['Price Big']),
      mediumQuantity: this.helperService.parseIntOrNull(row['Medium Quantity']),
      mediumUnit: this.helperService.parseStringOrNull(row['Medium Unit']),
      priceMedium: this.helperService.parseFloatOrNull(row['Price Medium']),
      smallQuantity: this.helperService.parseIntOrNull(row['Small Quantity']),
      smallUnit: this.helperService.parseStringOrNull(row['Small Unit']),
      priceSmall: this.helperService.parseFloatOrNull(row['Price Small']),
      createdAt: this.helperService.parseDateTime(
        row['Invoice Date'],
        row['Invoice Time'],
      ),
    });

    return saleItem;
  }

  async getOrCreateItem(row: any): Promise<Product> {
    let item = await this.itemModel.findOne({
      where: { name: row['Item Name'] },
    });

    if (!item) {
      item = this.itemModel.build({
        code: row['Item Code'],
        name: row['Item Name'],
        salesCount: 0,
        returnsCount: 0,
        createdAt: this.helperService.parseDateTime(
          row['Invoice Date'],
          row['Invoice Time'],
        ),
      });
    }

    item.salesCount += 1;
    await this.updateMonthlySalesCount(
      item,
      this.helperService.parseDateTime(
        row['Invoice Date'],
        row['Invoice Time'],
      ),
      1,
    );

    await item.save();

    return item;
  }

  async getOrCreateItemForReturn(row: any): Promise<Product> {
    let item = await this.itemModel.findOne({
      where: { name: row['Item Name'] },
    });

    if (!item) {
      item = await this.itemModel.create({
        code: row['Item Code'],
        name: row['Item Name'],
        salesCount: 0,
        returnsCount: 0,
        createdAt: this.helperService.parseDateDynamic(row['Invoice Date']),
      });
    }

    return item;
  }

  async findSaleItem(itemCode: number) {
    const item = await this.itemModel.findOne({
      where: { code: itemCode },
    });
    if (!item) {
      return null;
    }
    return item;
  }

  async createReturnItem(
    returnEntity: Return,
    row: any,
  ): Promise<ReturnProducts> {
    const item = await this.getOrCreateItemForReturn(row);

    const returnItem = await this.returnItemModel.create({
      returnId: returnEntity.returnCode,
      itemId: item.code,
      batchNumber: row['Batch Number'],
      returnSkuQty: row['Return SKU Qty'],
      expiryDate: this.helperService.parseDateDynamic(row['Expiry Date']),
      bigQuantity: this.helperService.parseFloatOrNull(row['Big Quantity']),
      bigUnit: this.helperService.parseStringOrNull(row['Big Unit']),
      priceBig: this.helperService.parseFloatOrNull(row['Price Big']),
      mediumQuantity: this.helperService.parseIntOrNull(row['Medium Quantity']),
      mediumUnit: this.helperService.parseStringOrNull(row['Medium Unit']),
      priceMedium: this.helperService.parseFloatOrNull(row['Price Medium']),
      smallQuantity: this.helperService.parseIntOrNull(row['Small Quantity']),
      smallUnit: this.helperService.parseStringOrNull(row['Small Unit']),
      priceSmall: this.helperService.parseFloatOrNull(row['Price Small']),
    });

    item.returnsCount += 1;
    await this.updateMonthlyReturnCount(
      item.code,
      this.helperService.parseDateTime(row['Return Date'], row['Return Time']),
      1,
    );

    await item.save();
    return returnItem;
  }
}
