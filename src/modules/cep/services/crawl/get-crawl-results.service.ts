import { Injectable, NotFoundException } from '@nestjs/common';
import { CrawlResultsResponseDto } from '../../dtos/crawl-results.response.dto';
import { CrawlRepository } from '../../repositories/crawl.repository';
import { CepResultRepository } from '../../repositories/cep-result.repository';

@Injectable()
export class GetCrawlResultsService {
  constructor(
    private readonly crawlRepository: CrawlRepository,
    private readonly cepResultRepository: CepResultRepository,
  ) {}

  async execute(
    crawlId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CrawlResultsResponseDto> {
    const crawl = await this.crawlRepository.findByCrawlId(crawlId);
    if (!crawl) {
      throw new NotFoundException(`Crawl com ID ${crawlId} não encontrado`);
    }

    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      this.cepResultRepository.findByCrawlId(crawlId, skip, limit),
      this.cepResultRepository.countByCrawlId(crawlId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      results: results.map((result) => ({
        cep: result.cep,
        status: result.status as 'success' | 'error',
        data: result.data,
        error: result.error,
        processed_at: result.processed_at,
        retry_count: result.retry_count,
      })),
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }
}
