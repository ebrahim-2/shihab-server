import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { createSqlQueryChain } from 'langchain/chains/sql_db';
import { createSqlAgent, SqlToolkit } from 'langchain/agents/toolkits/sql';
import { SqlDatabase } from 'langchain/sql_db';
import { DataSource } from 'typeorm';
// @ts-ignore
import * as XLSX from 'xlsx';
import * as path from 'path';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Salesman } from './entities/salesman.entity';
import { Sale } from './entities/sale.entity';
import { Return } from './entities/return.entity';
import { Collection } from './entities/collection.entity';
import { Product } from './entities/product.entity';
import { ProductSale } from './entities/product-sale.entity';
import { ReturnProducts } from './entities/return-products.entity';
import { parse, parseISO, isValid } from 'date-fns';
import {
  AgentExecutor,
  createOpenAIFunctionsAgent,
  createOpenAIToolsAgent,
} from 'langchain/agents';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { QuerySqlTool } from './toolkits/sql-tools';
import { HelperService } from './services/helper.service';
import { ItemService } from './services/items.service';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { MessagesPoll } from './entities/message-poll.entity';
import { User } from './auth/entities/user.entity';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectModel(Customer)
    private customerModel: typeof Customer,
    @InjectModel(Salesman)
    private salesmanModel: typeof Salesman,
    @InjectModel(Sale)
    private saleModel: typeof Sale,
    @InjectModel(Return)
    private returnModel: typeof Return,
    @InjectModel(Message)
    private messageModel: typeof Message,
    @InjectModel(MessagesPoll)
    private messagesPollModel: typeof MessagesPoll,
    // @InjectModel(Collection)
    // private collectionRepository: typeof Collection,
    private itemService: ItemService,
    private helperService: HelperService,
    private sequelize: Sequelize,
  ) {}

  async onModuleInit() {
    await this.sequelize.sync({ alter: true });
  }

  async chat(userQuery: string): Promise<any> {
    try {
      const datasource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
      });

      const toolkit = new SqlToolkit(db);
      toolkit.dialect = 'postgres';

      const model = new ChatOpenAI({
        temperature: 0,
        modelName: 'gpt-4o',
      });

      const executor = createSqlAgent(model, toolkit);

      const result = await executor.invoke({
        input: userQuery,
      });

      return result.output;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async toArabicMessage(question: string, query: string) {
    try {
      const model = new ChatOpenAI({
        temperature: 0,
        modelName: 'gpt-4o-mini',
      });

      const promptTemplate = PromptTemplate.fromTemplate(
        'based on this questions:{question} and this query restult: {query} you will respond to the client in arabic language and format the text if necessary',
      );

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

      return chain.invoke({
        question,
        query,
      });
    } catch (error) {
      throw error;
    }
  }

  async readExcelFile(): Promise<void> {
    const filePath = path.join(__dirname, '..', 'assets', 'test.xlsx');
    const workbook = XLSX.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      switch (sheetName) {
        case 'مبيعات المندوبين':
          await this.processSales(data);
          break;
        case 'مرتجعات المندوبين':
          await this.processReturns(data);
          break;
        // case 'تحصيلات المندوبين':
        //   await this.processCollections(data);
        //   break;
      }
    }
  }

  async processSales(data: any[]): Promise<void> {
    for (const row of data) {
      const customer = await this.getOrCreateCustomer(
        row['Customer Code'],
        row,
      );
      const salesman = await this.getOrCreateSalesman(
        row['Salesman Code'],
        row,
      );

      // Check if a sale with this invoice code already exists
      let sale = await this.saleModel.findOne({
        where: { invoiceCode: row['Invoice Code'] },
      });

      if (!sale) {
        // If the sale doesn't exist, create a new one
        sale = this.saleModel.build({
          invoiceDateTime: this.helperService.parseDateTime(
            row['Invoice Date'],
            row['Invoice Time'],
          ),
          invoiceCode: row['Invoice Code'],
          customerId: customer.code,
          salesmanId: salesman.code,
          totalAmount: 0, // Initialize totalAmount
          discountAmount: 0,
        });

        await sale.save();
      }

      // Create and add the new sale item to the existing or new sale
      await this.itemService.createSaleItem(row, sale);

      sale.totalAmount += row['Line Amount'];
      sale.discountAmount += row['Discount Amount'];

      customer.totalPurchaseCount += 1;
      customer.totalPurchaseAmount += row['Line Amount'];

      await customer.save();

      salesman.totalSalesCount += 1;
      salesman.totalSalesAmount += row['Line Amount'];

      await salesman.save();

      // Save the updated sale
      await sale.save();

      await sale;
    }
  }

  async processReturns(data: any[]): Promise<void> {
    for (const row of data) {
      const customer = await this.getOrCreateCustomer(
        row['Customer Code'],
        row,
      );
      const salesman = await this.getOrCreateSalesman(
        row['Salesman Code'],
        row,
      );

      let sale: any = await this.findOrCreateSaleByCode(
        row['Invoice Code'],
        row,
      );

      let returnEntity = await this.returnModel.findOne({
        where: { returnCode: row['Return Code'] },
      });

      if (!returnEntity) {
        returnEntity = await this.returnModel.create({
          returnDateTime: this.helperService.parseDateTime(
            row['Return Date'],
            row['Return Time'],
          ),
          returnCode: row['Return Code'],
          currency: row['Currency'],
          type: row['Type'],
          originalInvoiceId: sale.invoiceCode,
          customerId: customer.code,
          salesmanId: salesman.code,
          totalAmount: 0,
        });
      }

      returnEntity.totalAmount += row['Total Amount'];
      await returnEntity.save();

      // Create and associate ReturnItem
      await this.itemService.createReturnItem(returnEntity, row);
    }
  }

  async findSaleByInvoiceId(invoiceId: string): Promise<Sale> {
    const sale = await this.saleModel.findOne({
      where: { invoiceCode: invoiceId },
    });

    if (!sale) {
      return null;
    }
    return sale;
  }
  // async processCollections(data: any[]): Promise<void> {
  //   for (const row of data) {
  //     const customer = await this.getOrCreateCustomer(
  //       row['Customer Code'],
  //       row['Customer Name'],
  //     );
  //     const salesman = await this.getOrCreateSalesman(
  //       row['Salesman Code'],
  //       row['Salesman Name'],
  //     );

  //     const collection = this.collectionRepository.create({
  //       collectionCode: row['Collection Code'],
  //       collectionType: row['Collection Type'],
  //       collectionDate: new Date(row['Collection Date']),
  //       amount: row['Amount'],
  //       currency: row['Currency'],
  //       settled: row['Settled'],
  //       paymentType: row['Payment Type'],
  //       customer,
  //       salesman,
  //     });

  //     await this.collectionRepository.save(collection);
  //   }
  // }

  // private async getOrCreateInvoice(
  //   invoiceCode: string,
  //   customer: Customer,
  //   salesman: Salesman,
  // ): Promise<Invoice> {
  //   let invoice = await this.invoiceRepository.findOne({
  //     where: { invoiceCode },
  //   });
  //   if (!invoice) {
  //     invoice = this.invoiceRepository.create({
  //       invoiceCode,
  //       customer,
  //       salesman,
  //       discountAmount: 0,
  //     });
  //     await this.invoiceRepository.save(invoice);
  //   }
  //   return invoice;
  // }

  // private updateInvoiceStatus(
  //   invoice: Invoice,
  //   collectionAmount: number,
  // ): string {
  //   const totalCollected =
  //     invoice.collections.reduce(
  //       (sum, collection) => sum + collection.amount,
  //       0,
  //     ) + collectionAmount;
  //   if (totalCollected >= invoice.totalAmount) {
  //     return 'paid';
  //   } else if (totalCollected > 0) {
  //     return 'partially_paid';
  //   }
  //   return 'unpaid';
  // }

  async getOrCreateCustomer(code: string, row: any): Promise<Customer> {
    let customer = await this.customerModel.findOne({ where: { code } });

    if (!customer) {
      customer = await this.customerModel.create({
        code,
        name: row['Customer Name'],
        phoneNumber: row['Phone number'],
        address: row['Address'],
        area: row['Area'],
        totalPurchaseCount: 0,
        totalPurchaseAmount: 0,
      });
    }

    return customer;
  }

  async getOrCreateSalesman(code: number, row: string): Promise<Salesman> {
    let salesman = await this.salesmanModel.findOne({ where: { code } });

    if (!salesman) {
      salesman = await this.salesmanModel.create({
        code,
        name: row['Salesman Name'],
        totalSalesCount: 0,
        totalSalesAmount: 0,
      });
    }

    return salesman;
  }

  async findCustomerByCode(code: string): Promise<Customer> {
    const customer = await this.customerModel.findOne({ where: { code } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async findSalesmanByCode(code: number): Promise<Salesman> {
    const salesman = await this.salesmanModel.findOne({ where: { code } });
    if (!salesman) {
      return null;
    }
    return salesman;
  }

  async findOrCreateSaleByCode(invoiceCode: string, row: any): Promise<Sale> {
    let sale = await this.saleModel.findOne({
      where: { invoiceCode },
    });

    if (!sale) {
      sale = await this.saleModel.create({
        invoiceDateTime: this.helperService.parseDateDynamic(
          row['Invoice Date'],
        ),
        invoiceCode,
        customerId: row['Customer Code'],
        salesmanId: row['Salesman Code'],
        discountAmount: 0,
        totalAmount: row['Line Amount'],
      });
    }
    return sale;
  }

  async createMessage(body: CreateMessageDto, user: User) {
    try {
      let messagesPoll;
      const messagePollName = this.getFourWords(body.message);

      if (body.messagePollId === undefined) {
        messagesPoll = await this.messagesPollModel.create({
          userId: user.id,
          name: messagePollName,
        });
      } else {
        messagesPoll = await this.messagesPollModel.findOne({
          where: { id: body.messagePollId },
        });
      }

      const userMessage = await this.messageModel.create({
        message: body.message,
        messagePollId: messagesPoll.id,
      });

      const agentResult = await this.chat(body.message);

      const nextMessage = await this.toArabicMessage(body.message, agentResult);

      const llmMessage = await this.messageModel.create({
        message: nextMessage,
        messagePollId: messagesPoll.id,
        assistant: true,
      });

      return [userMessage, llmMessage];
    } catch (error) {
      throw error;
    }
  }

  async getMessagesByPollId(id: number) {
    try {
      return this.messageModel.findAll({ where: { messagePollId: id } });
    } catch (error) {
      throw error;
    }
  }

  async getMessagesPoll(user: User) {
    try {
      return this.messagesPollModel.findAll({ where: { userId: user.id } });
    } catch (error) {
      throw error;
    }
  }

  getFourWords(input: string): string {
    const words = input.split(' ');
    let fourWords = words;

    if (words.length >= 4) {
      fourWords = words.slice(0, 4);
    }

    return fourWords.join(' ');
  }

  async clearAllData() {
    const sequelize = this.sequelize;

    await sequelize.transaction(async (transaction) => {
      // Disable all triggers
      await sequelize.query('SET session_replication_role = replica;', {
        transaction,
      });

      // Get all model names
      const models = Object.values(sequelize.models);

      // Truncate all tables
      for (const model of models) {
        await sequelize.query(`TRUNCATE TABLE "${model.tableName}" CASCADE;`, {
          transaction,
        });
        console.log(`Cleared table: ${model.tableName}`);
      }

      // Re-enable all triggers
      await sequelize.query('SET session_replication_role = DEFAULT;', {
        transaction,
      });
    });

    console.log('All data cleared successfully');
  }
}

/**
 * Sheets in the Excel file:
[ 'مبيعات المندوبين', 'مرتجعات المندوبين', 'تحصيلات المندوبين' ]

Columns in sheet "مبيعات المندوبين":
[
  'Invoice Date',    'Invoice Time',
  'Invoice Code',    'Customer Code',
  'Customer Name',   'Salesman Code',
  'Salesman Name',   'Item Code',
  'Item Name',       'Batch Number',
  'Expiry Date',     'Big Quantity',
  'Big Unit',        'Price Big',
  'Medium Quantity', 'Medium Unit',
  'Price Medium',    'Small Quantity',
  'Small Unit',      'Price Small',
  'Discount Amount', 'Line Amount',
  'Area',            'Address',
  'Phone number'
]

Columns in sheet "مرتجعات المندوبين":
[
  'Return Date',     'Return Time',
  'Return Code',     'Customer Code',
  'Customer Name',   'Salesman Code',
  'Salesman Name',   'Item Code',
  'Item Name',       'Batch Number',
  'Expiry Date',     'Big Quantity',
  'Big Unit',        'Price Big',
  'Medium Quantity', 'Medium Unit',
  'Price Medium',    'Small Quantity',
  'Small Unit',      'Price Small',
  'Discount Amount', 'Line Amount',
  'Invoice Code',    'Invoice Date',
  'Return SKU Qty',  'Total Amount',
  'Currency',        'Type',
  'Notes',           'Area',
  'اAddress',        'Phone number'
]

Columns in sheet "تحصيلات المندوبين":
[
  'Collection Code', 'Collection Type',
  'Invoice Code',    'Customer Code',
  'Customer Name',   'Salesman Code',
  'Salesman Name',   'Location',
  'Collection Date', 'Amount',
  'Currency',        'Settled',
  'Payment Type',    'Notes',
  'ERP Status',      'ERP Message',
  'Area',            'Address',
  'Phone number'
]
 */

/* 
  async chat(userQuery: string): Promise<any> {
    const datasource = new DataSource({
      type: 'sqlite',
      database: 'db/shihab.db',
    });

    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: datasource,
    });

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: 'gpt-4o-mini',
    });

    const toolkit = new SqlToolkit(db, model);

    const executor = createSqlAgent(model, toolkit);

    const result = await executor.invoke({
      input: userQuery,
    });

    return result;
  }
**/
