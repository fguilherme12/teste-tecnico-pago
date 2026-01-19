import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly requestsPerSecond: number;
  private readonly concurrency: number;
  private activeRequests: number = 0;
  private lastRequestTime: number = 0;
  private minInterval: number;
  private backoffMultiplier: number = 1;
  private readonly maxBackoffMultiplier: number = 16;

  constructor(private readonly configService: ConfigService) {
    this.requestsPerSecond = this.configService.get<number>('RATE_LIMIT_REQUESTS_PER_SECOND', 3);
    this.concurrency = this.configService.get<number>('WORKER_CONCURRENCY', 2);
    this.minInterval = 1000 / this.requestsPerSecond;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeRequests >= this.concurrency) {
      await this.sleep(50);
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const effectiveInterval = this.minInterval * this.backoffMultiplier;

    if (timeSinceLastRequest < effectiveInterval) {
      const waitTime = effectiveInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.activeRequests++;
    this.lastRequestTime = Date.now();

    try {
      const result = await fn();
      this.decreaseBackoff();
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        this.increaseBackoff();
      }
      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  private increaseBackoff(): void {
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, this.maxBackoffMultiplier);
    this.logger.warn(`Rate limit detectado, aumentando backoff para ${this.backoffMultiplier}x`);
  }

  private decreaseBackoff(): void {
    if (this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(this.backoffMultiplier * 0.9, 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus(): { activeRequests: number; backoffMultiplier: number } {
    return {
      activeRequests: this.activeRequests,
      backoffMultiplier: this.backoffMultiplier,
    };
  }
}
