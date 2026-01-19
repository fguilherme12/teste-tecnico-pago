import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '../../modules/cep/queue/queue.service';
import { ViaCepService } from '../../integrations/viacep/viacep.service';
import { RateLimiterService } from './rate-limiter/rate-limiter.service';
import { CrawlRepository } from '../../modules/cep/repositories/crawl.repository';
import { CepResultRepository } from '../../modules/cep/repositories/cep-result.repository';
import { ReceivedMessage } from '../../modules/cep/queue/queue.service.interface';

@Injectable()
export class CepProcessorWorker {
  private readonly logger = new Logger(CepProcessorWorker.name);
  private readonly maxRetries: number;
  private isRunning = false;
  private processedCount = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly viaCepService: ViaCepService,
    private readonly rateLimiter: RateLimiterService,
    private readonly crawlRepository: CrawlRepository,
    private readonly cepResultRepository: CepResultRepository,
  ) {
    this.maxRetries = this.configService.get<number>('MAX_RETRIES', 3);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.log('Worker iniciado');

    while (this.isRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        this.logger.error('Erro no processamento:', error);
        await this.sleep(5000);
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    this.logger.log('Worker parado');
  }

  private async processMessages(): Promise<void> {
    const messages = await this.queueService.receiveMessages(10);

    if (messages.length === 0) {
      await this.sleep(1000);
      return;
    }

    const crawlIds = [...new Set(messages.map((m) => m.crawl_id))];
    for (const crawlId of crawlIds) {
      await this.crawlRepository.markAsStarted(crawlId);
    }

    const processingPromises = messages.map((message) =>
      this.processWithRateLimit(message),
    );

    await Promise.all(processingPromises);
  }

  private async processWithRateLimit(message: ReceivedMessage): Promise<void> {
    try {
      await this.rateLimiter.execute(() => this.processMessage(message));
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        this.logger.warn(`Rate limit para CEP ${message.cep}, aguardando...`);
        await this.sleep(5000);
        return;
      }
      this.logger.error(`Erro processando CEP ${message.cep}:`, error);
    }
  }

  private async processMessage(message: ReceivedMessage): Promise<void> {
    const existing = await this.cepResultRepository.findByCrawlIdAndCep(
      message.crawl_id,
      message.cep,
    );
    const retryCount = existing?.retry_count || 0;

    try {
      const result = await this.viaCepService.consultarCep(message.cep);

      if (result) {
        await this.cepResultRepository.upsert({
          crawl_id: message.crawl_id,
          cep: message.cep,
          status: 'success',
          data: result,
          retry_count: retryCount,
        });
        await this.crawlRepository.incrementStats(message.crawl_id, 'success');
      } else {
        await this.cepResultRepository.upsert({
          crawl_id: message.crawl_id,
          cep: message.cep,
          status: 'error',
          error: {
            message: 'CEP não encontrado',
            code: 'CEP_NOT_FOUND',
          },
          retry_count: retryCount,
        });
        await this.crawlRepository.incrementStats(message.crawl_id, 'error');
      }

      await this.queueService.deleteMessage(message.receiptHandle);
      await this.checkAndFinalizeCrawl(message.crawl_id);

      this.processedCount++;
      if (this.processedCount % 100 === 0) {
        this.logger.log(`Processados: ${this.processedCount} CEPs`);
      }
    } catch (error) {
      await this.handleError(message, error, retryCount);
    }
  }

  private async handleError(
    message: ReceivedMessage,
    error: unknown,
    retryCount: number,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isRetryable = this.isRetryableError(errorMessage);

    if (isRetryable && retryCount < this.maxRetries) {
      await this.cepResultRepository.upsert({
        crawl_id: message.crawl_id,
        cep: message.cep,
        status: 'pending',
        error: {
          message: errorMessage,
          code: this.getErrorCode(errorMessage),
        },
        retry_count: retryCount + 1,
      });

      const backoffDelay = Math.pow(2, retryCount + 1) * 1000;
      this.logger.log(`Retry ${retryCount + 1}/${this.maxRetries} para CEP ${message.cep} em ${backoffDelay}ms`);
      await this.sleep(backoffDelay);
      return;
    }

    await this.cepResultRepository.upsert({
      crawl_id: message.crawl_id,
      cep: message.cep,
      status: 'error',
      error: {
        message: errorMessage,
        code: this.getErrorCode(errorMessage),
      },
      retry_count: retryCount,
    });

    await this.crawlRepository.incrementStats(message.crawl_id, 'error');
    await this.queueService.deleteMessage(message.receiptHandle);
    await this.checkAndFinalizeCrawl(message.crawl_id);
  }

  private async checkAndFinalizeCrawl(crawlId: string): Promise<void> {
    const crawl = await this.crawlRepository.findByCrawlId(crawlId);
    if (!crawl) return;

    if (crawl.stats.processed >= crawl.total_ceps) {
      const status = crawl.stats.errors === crawl.total_ceps ? 'failed' : 'finished';
      await this.crawlRepository.markAsFinished(crawlId, status);
      this.logger.log(`Crawl ${crawlId} finalizado: ${status}`);
    }
  }

  private isRetryableError(errorMessage: string): boolean {
    return (
      errorMessage === 'RATE_LIMIT_EXCEEDED' ||
      errorMessage === 'TIMEOUT' ||
      errorMessage.startsWith('HTTP_ERROR:5') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ENOTFOUND')
    );
  }

  private getErrorCode(errorMessage: string): string {
    if (errorMessage === 'RATE_LIMIT_EXCEEDED') return 'RATE_LIMIT';
    if (errorMessage === 'TIMEOUT') return 'TIMEOUT';
    if (errorMessage.startsWith('HTTP_ERROR:')) return 'HTTP_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
