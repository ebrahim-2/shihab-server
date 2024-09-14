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
import { Neo4jService } from './services/neo4j.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

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
    private neo4jService: Neo4jService,
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

      const model = new ChatGoogleGenerativeAI({
        temperature: 0,
        model: 'gemini-1.5-pro',
      });

      // @ts-ignore
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

      // @ts-ignore
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
        case 'مرتجعات المندوبين':
          await this.processReturns(data);
          break;
        case 'تحصيلات المندوبين':
          await this.processCollections(data);
          break;
      }
    }
  }

  async processSales(data: any[]): Promise<void> {
    const session = this.neo4jService.getSession();

    for (const row of data) {
      await session.run(
        `MERGE (c:Customer {code: $customerCode})
      ON CREATE SET c.name = $customerName, c.phone = toInteger($phoneNumber), c.address = $address
      MERGE (s:Salesman {code: toInteger($salesmanCode)})
      ON CREATE SET s.name = $salesmanName
      MERGE (i:Product {code: toInteger($itemCode)})
      ON CREATE SET i.name = $itemName, i.priceBig = toInteger($priceBig), i.priceMedium = toInteger($priceMedium), i.priceSmall = toInteger($priceSmall), i.bigUnit = $bigUnit, i.mediumUnit = $mediumUnit, i.smallUnit = $smallUnit
      MERGE (a:Area {name: $area})
      MERGE (o:Order {invoiceCode: $invoiceCode})
      ON CREATE SET o.invoiceDate = datetime($date), o.discountAmount = toInteger($discountAmount), o.lineAmount = toInteger($lineAmount)
      MERGE (c)-[:PLACED_ORDER]->(o)
      MERGE (s)-[:SOLD_ORDER]->(o)
      MERGE (o)-[saleP:CONTAINS_PRODUCT]->(i)
      MERGE (o)-[:DELIVERED_IN]->(a)
      MERGE (c)-[:LOCATED_IN]->(a)
       SET saleP.batchNumber = $batchNumber,
       saleP.bigQuantity = toInteger($bigQuantity),
       saleP.mediumQuantity = toInteger($mediumQuantity),
       saleP.smallQuantity = toInteger($smallQuantity)
      `,
        {
          customerCode: row['Customer Code'],
          customerName: row['Customer Name'],
          phoneNumber: row['Phone number'],
          address: row['Address'],
          area: row['Area'],
          salesmanCode: row['Salesman Code'],
          salesmanName: row['Salesman Name'],
          itemCode: row['Item Code'],
          itemName: row['Item Name'],
          invoiceCode: row['Invoice Code'],
          date: this.helperService
            .parseDateTime(row['Invoice Date'], row['Invoice Time'])
            .toISOString(),
          batchNumber: row['Batch Number'],
          discountAmount: row['Discount Amount'],
          totalAmount: row['Line Amount'],
          bigQuantity: this.helperService.parseFloatOrNull(row['Big Quantity']),
          bigUnit: this.helperService.parseStringOrNull(row['Big Unit']),
          priceBig: this.helperService.parseFloatOrNull(row['Price Big']),
          mediumQuantity: this.helperService.parseIntOrNull(
            row['Medium Quantity'],
          ),
          mediumUnit: this.helperService.parseStringOrNull(row['Medium Unit']),
          priceMedium: this.helperService.parseFloatOrNull(row['Price Medium']),
          smallQuantity: this.helperService.parseIntOrNull(
            row['Small Quantity'],
          ),
          smallUnit: this.helperService.parseStringOrNull(row['Small Unit']),
          priceSmall: this.helperService.parseFloatOrNull(row['Price Small']),
          lineAmount: row['Line Amount'],
        },
      );
    }
  }

  async processReturns(data: any[]): Promise<void> {
    const session = this.neo4jService.getSession();

    for (const row of data) {
      await session.run(
        `MERGE (c:Customer {code: $customerCode})
      ON CREATE SET c.name = $customerName, c.phone = toInteger($phoneNumber), c.address = $address
      MERGE (s:Salesman {code: toInteger($salesmanCode)})
      ON CREATE SET s.name = $salesmanName
      MERGE (i:Product {code: toInteger($itemCode)})
      ON CREATE SET i.name = $itemName, i.priceBig = toInteger($priceBig), i.priceMedium = toInteger($priceMedium), i.priceSmall = toInteger($priceSmall), i.bigUnit = $bigUnit, i.mediumUnit = $mediumUnit, i.smallUnit = $smallUnit

      MERGE (a:Area {name: $area})

      MERGE (o:Order {invoiceCode: $invoiceCode})

      MERGE (r:Return {returnCode: $returnCode})
      ON CREATE SET r.returnDate = datetime($date),  r.returnedAmount = toInteger($lineAmount)

      MERGE (c)-[:RETURNED]->(r)
      MERGE (r)-[:RETURNED_TO]->(s)
      MERGE (r)-[returnedP:RETURNED_PRODUCT]->(i)
      MERGE (r)-[:RETURNED_IN]->(a)
      MERGE (r)-[:RETURNED_FROM]->(o)

       SET returnedP.batchNumber = $batchNumber,
       returnedP.bigQuantity = toInteger($bigQuantity),
       returnedP.mediumQuantity = toInteger($mediumQuantity),
       returnedP.smallQuantity = toInteger($smallQuantity)
      `,
        {
          customerCode: row['Customer Code'],
          customerName: row['Customer Name'],
          phoneNumber: row['Phone number'],
          address: row['اAddress'],
          area: row['Area'],
          salesmanCode: row['Salesman Code'],
          salesmanName: row['Salesman Name'],
          itemCode: row['Item Code'],
          itemName: row['Item Name'],
          invoiceCode: row['Invoice Code'],
          date: this.helperService
            .parseDateTime(row['Return Date'], row['Return Time'])
            .toISOString(),
          batchNumber: row['Batch Number'],
          totalAmount: row['Line Amount'],
          bigQuantity: this.helperService.parseFloatOrNull(row['Big Quantity']),
          bigUnit: this.helperService.parseStringOrNull(row['Big Unit']),
          priceBig: this.helperService.parseFloatOrNull(row['Price Big']),
          mediumQuantity: this.helperService.parseIntOrNull(
            row['Medium Quantity'],
          ),
          mediumUnit: this.helperService.parseStringOrNull(row['Medium Unit']),
          priceMedium: this.helperService.parseFloatOrNull(row['Price Medium']),
          smallQuantity: this.helperService.parseIntOrNull(
            row['Small Quantity'],
          ),
          smallUnit: this.helperService.parseStringOrNull(row['Small Unit']),
          priceSmall: this.helperService.parseFloatOrNull(row['Price Small']),
          lineAmount: row['Line Amount'],
          returnCode: row['Return Code'],
        },
      );
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
  async processCollections(data: any[]): Promise<void> {
    const session = this.neo4jService.getSession();

    for (const row of data) {
      await session.run(
        `MERGE (c:Customer {code: $customerCode})
      ON CREATE SET c.name = $customerName, c.phone = toInteger($phoneNumber), c.address = $address
      MERGE (s:Salesman {code: toInteger($salesmanCode)})
      ON CREATE SET s.name = $salesmanName

      MERGE (a:Area {name: $area})

      MERGE (o:Collection {collectionCode: $collectionCode})
      ON CREATE SET o.collectionDate =  datetime($date), o.collectionAmount = toInteger($amount)

      MERGE (o)-[:COLLECTED_FROM]->(c)
      MERGE (o)-[:COLLECTED_IN]->(a)
      MERGE (o)-[:COLLECTED_BY]->(s)
      `,
        {
          customerCode: row['Customer Code'],
          customerName: row['Customer Name'],
          phoneNumber: row['Phone number'],
          address: row['Address'],
          area: row['Area'],
          salesmanCode: row['Salesman Code'],
          salesmanName: row['Salesman Name'],
          collectionCode: row['Collection Code'],
          date: this.helperService
            .parseDateDynamic(row['Collection Date'])
            .toISOString(),
          amount: row['Amount'],
        },
      );
    }
  }

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
