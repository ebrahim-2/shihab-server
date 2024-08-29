import { Injectable } from '@nestjs/common';
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';
import { ChatOpenAI, OpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { GraphCypherQAChain } from '@langchain/community/chains/graph_qa/cypher';
import { SemanticSimilarityExampleSelector } from '@langchain/core/example_selectors';
import { Neo4jVectorStore } from '@langchain/community/vectorstores/neo4j_vector';
import { examples } from 'src/toolkits/few-shot-examples';

@Injectable()
export class GraphService {
  url = 'bolt://localhost:7687';
  username = 'neo4j';
  password = '733331122@';

  constructor() {}

  async getGraph() {
    const graph = await Neo4jGraph.initialize({
      url: this.url,
      username: this.username,
      password: this.password,
      database: 'neo4j',
    });
    return graph;
  }

  async test(query: string) {
    const graph = await this.getGraph();

    // return graph.getSchema();
    const llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

    const chain = GraphCypherQAChain.fromLLM({
      // @ts-ignore
      llm,
      graph,
      returnIntermediateSteps: true,
    });

    const response = await chain.invoke({
      query: query,
    });

    return response;
  }
  // Add your service methods here
}
