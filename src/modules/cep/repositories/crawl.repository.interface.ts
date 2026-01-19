export interface ICrawlRepository {
  create(data: CreateCrawlData): Promise<void>;
  findByCrawlId(crawlId: string): Promise<CrawlDocument | null>;
  updateStatus(crawlId: string, status: CrawlStatus): Promise<void>;
  incrementStats(crawlId: string, type: 'success' | 'error'): Promise<void>;
  markAsStarted(crawlId: string): Promise<void>;
  markAsFinished(crawlId: string, status: 'finished' | 'failed'): Promise<void>;
}

export interface CreateCrawlData {
  crawl_id: string;
  cep_start: string;
  cep_end: string;
  total_ceps: number;
  status: CrawlStatus;
  stats: CrawlStats;
}

export interface CrawlDocument {
  _id: string;
  crawl_id: string;
  cep_start: string;
  cep_end: string;
  total_ceps: number;
  status: CrawlStatus;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  finished_at?: Date;
  stats: CrawlStats;
}

export type CrawlStatus = 'pending' | 'running' | 'finished' | 'failed';

export interface CrawlStats {
  processed: number;
  success: number;
  errors: number;
}
