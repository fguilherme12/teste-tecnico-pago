import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { CreateCrawlRequestDto } from '../../dtos/create-crawl.request.dto';
import { CreateCrawlResponseDto } from '../../dtos/create-crawl.response.dto';
import { CepValidationService } from '../validation/cep-validation.service';
import { CrawlRepository } from '../../repositories/crawl.repository';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class CreateCrawlService {
  private readonly logger = new Logger(CreateCrawlService.name);

  constructor(
    private readonly cepValidationService: CepValidationService,
    private readonly crawlRepository: CrawlRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute(data: CreateCrawlRequestDto): Promise<CreateCrawlResponseDto> {
    const validation = this.cepValidationService.validateRange(data.cep_start, data.cep_end);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const crawlId = nanoid();
    const ceps = this.cepValidationService.generateCepRange(data.cep_start, data.cep_end);

    await this.crawlRepository.create({
      crawl_id: crawlId,
      cep_start: data.cep_start,
      cep_end: data.cep_end,
      total_ceps: ceps.length,
      status: 'pending',
      stats: {
        processed: 0,
        success: 0,
        errors: 0,
      },
    });

    const messages = ceps.map((cep) => ({
      crawl_id: crawlId,
      cep,
    }));

    await this.queueService.sendMessages(messages);

    this.logger.log(`Crawl ${crawlId} criado com ${ceps.length} CEPs`);

    return {
      crawl_id: crawlId,
      total_ceps: ceps.length,
      message: 'Crawl iniciado com sucesso',
    };
  }
}
