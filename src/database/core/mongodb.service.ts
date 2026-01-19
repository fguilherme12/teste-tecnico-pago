import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(MongoDbService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/cep-crawler');
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    this.logger.log('MongoDB conectado');
    await this.createIndexes();
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('MongoDB desconectado');
  }

  private async createIndexes() {
    await this.db.collection('crawls').createIndex({ crawl_id: 1 }, { unique: true });
    await this.db.collection('cep_results').createIndex({ crawl_id: 1 });
    await this.db.collection('cep_results').createIndex({ crawl_id: 1, cep: 1 }, { unique: true });
  }

  getCollection<T extends Document = Document>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}
