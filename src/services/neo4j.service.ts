import { Injectable } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService {
  private driver: Driver;
  private readonly uri = 'bolt://localhost:7687/sales'; // Update with your Neo4j URI
  private readonly user = 'neo4j'; // Update with your Neo4j username
  private readonly password = '733331122@'; // Update with your Neo4j password
  private readonly database: 'sales';

  constructor() {
    this.driver = neo4j.driver(
      this.uri,
      neo4j.auth.basic(this.user, this.password),
      {},
    );
  }

  getSession(): Session {
    return this.driver.session();
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
