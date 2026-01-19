import { Module } from '@nestjs/common';
import { CepController } from './controllers/cep.controller';
import { CreateCrawlService } from './services/crawl/create-crawl.service';
import { GetCrawlStatusService } from './services/crawl/get-crawl-status.service';
import { GetCrawlResultsService } from './services/crawl/get-crawl-results.service';
import { CepValidationService } from './services/validation/cep-validation.service';
import { CrawlRepository } from './repositories/crawl.repository';
import { CepResultRepository } from './repositories/cep-result.repository';
import { QueueService } from './queue/queue.service';

@Module({
  controllers: [CepController],
  providers: [
    CreateCrawlService,
    GetCrawlStatusService,
    GetCrawlResultsService,
    CepValidationService,
    CrawlRepository,
    CepResultRepository,
    QueueService,
  ],
  exports: [CrawlRepository, CepResultRepository, QueueService],
})
export class CepModule {}
