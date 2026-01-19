import { ApiProperty } from '@nestjs/swagger';
import { ViaCepResponse } from '../../../integrations/viacep/viacep.service.interface';

export class CepResultDto {
  @ApiProperty()
  cep: string;

  @ApiProperty({ enum: ['success', 'error'] })
  status: 'success' | 'error';

  @ApiProperty({ required: false })
  data?: ViaCepResponse;

  @ApiProperty({ required: false })
  error?: {
    message: string;
    code?: string;
  };

  @ApiProperty()
  processed_at: Date;

  @ApiProperty()
  retry_count: number;
}

export class CrawlResultsResponseDto {
  @ApiProperty({ type: [CepResultDto] })
  results: CepResultDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}
