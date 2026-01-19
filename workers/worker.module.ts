import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../src/database/database.module';
import { CepProcessorModule } from '../src/workers/cep-processor/cep-processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CepProcessorModule,
  ],
})
export class WorkerModule {}
