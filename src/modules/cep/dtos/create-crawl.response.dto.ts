import { ApiProperty } from '@nestjs/swagger';

export class CreateCrawlResponseDto {
  @ApiProperty({
    description: 'Identificador único do crawl',
    example: 'abc123xyz',
  })
  crawl_id: string;

  @ApiProperty({
    description: 'Total de CEPs a serem processados',
    example: 1001,
  })
  total_ceps: number;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Crawl iniciado com sucesso',
  })
  message: string;
}
