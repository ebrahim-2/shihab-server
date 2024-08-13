import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Customer } from './entities/customer.entity';
import { Salesman } from './entities/salesman.entity';
import { Sale } from './entities/sale.entity';
import { Return } from './entities/return.entity';
import { Collection } from './entities/collection.entity';
import { Item } from './entities/item.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ReturnItem } from './entities/return-item.entity';
import { HelperService } from './services/helper.service';
import { ItemService } from './services/items.service';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [
        Customer,
        Salesman,
        Sale,
        Return,
        Collection,
        Item,
        SaleItem,
        ReturnItem,
      ],
      synchronize: true,
    }),
    SequelizeModule.forFeature([
      Customer,
      Salesman,
      Sale,
      Return,
      Collection,
      Item,
      SaleItem,
      ReturnItem,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, HelperService, ItemService],
})
export class AppModule {}
