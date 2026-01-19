import { Injectable, NotFoundException } from '@nestjs/common';
import { CrawlStatusResponseDto } from '../../dtos/crawl-status.response.dto';
import { CrawlRepository } from '../../repositories/crawl.repository';

@Injectable()
export class GetCrawlStatusService {
  constructor(private readonly crawlRepository: CrawlRepository) {}

  async execute(crawlId: string): Promise<CrawlStatusResponseDto> {
    const crawl = await this.crawlRepository.findByCrawlId(crawlId);

    if (!crawl) {
      throw new NotFoundException(`Crawl com ID ${crawlId} não encontrado`);
    }

    const progressPercentage = crawl.total_ceps > 0
      ? Math.round((crawl.stats.processed / crawl.total_ceps) * 100)
      : 0;

    return {
      crawl_id: crawl.crawl_id,
      cep_start: crawl.cep_start,
      cep_end: crawl.cep_end,
      total_ceps: crawl.total_ceps,
      processed: crawl.stats.processed,
      success: crawl.stats.success,
      errors: crawl.stats.errors,
      status: crawl.status,
      progress_percentage: progressPercentage,
      created_at: crawl.created_at,
      started_at: crawl.started_at,
      finished_at: crawl.finished_at,
    };
  }
}
