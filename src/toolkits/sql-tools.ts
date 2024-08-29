import type { BaseLanguageModelInterface } from '@langchain/core/language_models/base';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { BaseToolkit, Tool, ToolInterface } from '@langchain/core/tools';
import { PromptTemplate } from '@langchain/core/prompts';
import { SqlDatabase } from 'langchain/sql_db';
import { SqlTable } from 'langchain/dist/util/sql_utils';

interface SqlTool {
  db: SqlDatabase;
}

export class QuerySqlTool extends Tool implements SqlTool {
  static lc_name() {
    return 'QuerySqlTool';
  }

  name = 'query-sql';

  db: SqlDatabase;

  constructor(db: SqlDatabase) {
    super(...arguments);
    this.db = db;
  }

  /** @ignore */
  async _call(input: string) {
    try {
      return await this.db.run(input);
    } catch (error) {
      return `${error}`;
    }
  }

  description = `Input to this tool is a detailed and correct SQL query, output is a result from the database.
  If the query is not correct, an error message will be returned.
  If an error is returned, rewrite the query, check the query, and try again.`;
}

export class InfoSqlTool extends Tool implements SqlTool {
  static lc_name() {
    return 'InfoSqlTool';
  }

  name = 'info-sql';

  db: SqlDatabase;

  constructor(db: SqlDatabase) {
    super();
    this.db = db;
  }

  async _call(input: string) {
    try {
      const tables = input.split(',').map((table) => table.trim());
      return await this.db.getTableInfo(tables);
    } catch (error) {
      return `${error}`;
    }
  }

  description = `Input to this tool is a comma-separated list of tables, output is the schema and sample rows for those tables.
    Be sure that the tables actually exist by calling list-tables-sql first!

    Example Input: "table1, table2, table3.`;
}

export class ListTablesSqlTool extends Tool implements SqlTool {
  static lc_name() {
    return 'ListTablesSqlTool';
  }

  name = 'list-tables-sql';

  db: SqlDatabase;

  constructor(db: SqlDatabase) {
    super();
    this.db = db;
  }

  async _call(_: string) {
    try {
      let selectedTables: SqlTable[] = this.db.allTables;

      if (this.db.includesTables.length > 0) {
        selectedTables = selectedTables.filter((currentTable) =>
          this.db.includesTables.includes(currentTable.tableName),
        );
      }

      if (this.db.ignoreTables.length > 0) {
        selectedTables = selectedTables.filter(
          (currentTable) =>
            !this.db.ignoreTables.includes(currentTable.tableName),
        );
      }

      const tables = selectedTables.map((table: SqlTable) => table.tableName);
      return tables.join(', ');
    } catch (error) {
      return `${error}`;
    }
  }

  description = `Input is an empty string, output is a comma-separated list of tables in the database.`;
}

type QueryCheckerToolArgs = {
  llmChain?: any;
  llm?: ChatOpenAI;
  _chainType?: never;
};

export class QueryCheckerTool extends Tool {
  static lc_name() {
    return 'QueryCheckerTool';
  }

  name = 'query-checker';

  template = `
    {query}
Double check the SQL query above for common mistakes, including:
- Using NOT IN with NULL values
- Using UNION when UNION ALL should have been used
- Using BETWEEN for exclusive ranges
- Data type mismatch in predicates
- Properly quoting identifiers
- Using the correct number of arguments for functions
- Casting to the correct data type
- Using the proper columns for joins

If there are any of the above mistakes, rewrite the query. If there are no mistakes, just reproduce the original query.`;

  llmChain: any;

  constructor(llmChainOrOptions?: any | QueryCheckerToolArgs) {
    super();
    if (typeof llmChainOrOptions?._chainType === 'function') {
      this.llmChain = llmChainOrOptions;
    } else {
      const options = llmChainOrOptions as QueryCheckerToolArgs;
      if (options?.llmChain !== undefined) {
        this.llmChain = options.llmChain;
      } else {
        const prompt = new PromptTemplate({
          template: this.template,
          inputVariables: ['query'],
        });
        const llm = options?.llm ?? new OpenAI({ temperature: 0 });
        // @ts-ignore
        this.llmChain = new LLMChain({ llm, prompt });
      }
    }
  }

  /** @ignore */
  async _call(input: string) {
    return this.llmChain.predict({ query: input });
  }

  description = `Use this tool to double check if your query is correct before executing it.
    Always use this tool before executing a query with query-sql!`;
}

export class SqlToolkit extends BaseToolkit {
  tools: ToolInterface[];

  db: SqlDatabase;

  dialect = 'postgresql';

  constructor(db: SqlDatabase, llm?: ChatOpenAI) {
    super();
    this.db = db;
    this.tools = [
      new QuerySqlTool(db),
      new InfoSqlTool(db),
      new ListTablesSqlTool(db),
      new QueryCheckerTool({ llm }),
    ];
  }
}
