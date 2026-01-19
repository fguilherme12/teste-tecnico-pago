import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../../../database/core/mongodb.service';
import {
  ICepResultRepository,
  CreateCepResultData,
  CepResultDocument,
} from './cep-result.repository.interface';

@Injectable()
export class CepResultRepository implements ICepResultRepository {
  private readonly collectionName = 'cep_results';

  constructor(private readonly mongoDb: MongoDbService) {}

  async create(data: CreateCepResultData): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const doc = {
      ...data,
      processed_at: new Date(),
    };
    await collection.insertOne(doc as any);
  }

  async upsert(data: CreateCepResultData): Promise<void> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    await collection.updateOne(
      { crawl_id: data.crawl_id, cep: data.cep },
      {
        $set: {
          status: data.status,
          data: data.data,
          error: data.error,
          retry_count: data.retry_count,
          processed_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async findByCrawlId(crawlId: string, skip: number, limit: number): Promise<CepResultDocument[]> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const docs = await collection
      .find({ crawl_id: crawlId, status: { $ne: 'pending' } })
      .sort({ processed_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return docs as unknown as CepResultDocument[];
  }

  async countByCrawlId(crawlId: string): Promise<number> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    return collection.countDocuments({ crawl_id: crawlId, status: { $ne: 'pending' } });
  }

  async findByCrawlIdAndCep(crawlId: string, cep: string): Promise<CepResultDocument | null> {
    const collection = this.mongoDb.getCollection(this.collectionName);
    const doc = await collection.findOne({ crawl_id: crawlId, cep });
    return doc as CepResultDocument | null;
  }
}
