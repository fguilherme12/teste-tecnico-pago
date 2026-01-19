import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('CEP Crawler API')
    .setDescription('API para crawl assíncrono de CEPs usando ViaCEP')
    .setVersion('1.0')
    .addTag('cep', 'Operações de crawl de CEPs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
