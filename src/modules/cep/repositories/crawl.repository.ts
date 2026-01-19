import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../../../database/core/mongodb.service';
import {
  ICrawlRepository,
  CreateCrawlData,
  CrawlStatus,
  CrawlDocument,
} from './crawl.repository.interface';

@Injectable()
export class CrawlRepository implements ICrawlRepository {
  private readonly collectionName = 'crawls';

  constructor(private readonly mongoDb: MongoDbService) {}

  async create(data: CreateCrawlData): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const doc = {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await collection.insertOne(doc as any);
  }

  async findByCrawlId(crawlId: string): Promise<CrawlDocument | null> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const doc = await collection.findOne({ crawl_id: crawlId });
    return doc as CrawlDocument | null;
  }

  async updateStatus(crawlId: string, status: CrawlStatus): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    await collection.updateOne(
      { crawl_id: crawlId },
      { $set: { status, updated_at: new Date() } },
    );
  }

  async incrementStats(crawlId: string, type: 'success' | 'error'): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const incField = type === 'success' ? 'stats.success' : 'stats.errors';
    await collection.updateOne(
      { crawl_id: crawlId },
      {
        $inc: { 'stats.processed': 1, [incField]: 1 },
        $set: { updated_at: new Date() },
      },
    );
  }

  async markAsStarted(crawlId: string): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    await collection.updateOne(
      { crawl_id: crawlId, status: 'pending' },
      {
        $set: {
          status: 'running',
          started_at: new Date(),
          updated_at: new Date(),
        },
      },
    );
  }

  async markAsFinished(crawlId: string, status: 'finished' | 'failed'): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    await collection.updateOne(
      { crawl_id: crawlId },
      {
        $set: {
          status,
          finished_at: new Date(),
          updated_at: new Date(),
        },
      },
    );
  }
}
