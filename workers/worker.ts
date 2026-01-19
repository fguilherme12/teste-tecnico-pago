import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { CepProcessorWorker } from '../src/workers/cep-processor/cep-processor.worker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const worker = app.get(CepProcessorWorker);

  const shutdown = async () => {
    console.log('Encerrando worker...');
    worker.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log('Iniciando worker de processamento de CEPs...');
  await worker.start();
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar worker:', error);
  process.exit(1);
});
