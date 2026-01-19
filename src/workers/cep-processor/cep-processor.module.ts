import { Module } from '@nestjs/common';
import { CepProcessorWorker } from './cep-processor.worker';
import { RateLimiterService } from './rate-limiter/rate-limiter.service';
import { CepModule } from '../../modules/cep/cep.module';
import { ViaCepModule } from '../../integrations/viacep/viacep.module';

@Module({
  imports: [CepModule, ViaCepModule],
  providers: [CepProcessorWorker, RateLimiterService],
  exports: [CepProcessorWorker],
})
export class CepProcessorModule {}
