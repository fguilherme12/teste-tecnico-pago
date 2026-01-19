import { ViaCepResponse } from '../../../integrations/viacep/viacep.service.interface';

export interface ICepResultRepository {
  create(data: CreateCepResultData): Promise<void>;
  upsert(data: CreateCepResultData): Promise<void>;
  findByCrawlId(crawlId: string, skip: number, limit: number): Promise<CepResultDocument[]>;
  countByCrawlId(crawlId: string): Promise<number>;
  findByCrawlIdAndCep(crawlId: string, cep: string): Promise<CepResultDocument | null>;
}

export interface CreateCepResultData {
  crawl_id: string;
  cep: string;
  status: 'success' | 'error' | 'pending';
  data?: ViaCepResponse;
  error?: {
    message: string;
    code?: string;
  };
  retry_count: number;
}

export interface CepResultDocument {
  _id: string;
  crawl_id: string;
  cep: string;
  status: 'success' | 'error' | 'pending';
  data?: ViaCepResponse;
  error?: {
    message: string;
    code?: string;
  };
  processed_at: Date;
  retry_count: number;
}
