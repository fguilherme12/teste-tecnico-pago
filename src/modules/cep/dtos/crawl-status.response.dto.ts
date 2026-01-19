import { ApiProperty } from '@nestjs/swagger';

export class CrawlStatusResponseDto {
  @ApiProperty()
  crawl_id: string;

  @ApiProperty()
  cep_start: string;

  @ApiProperty()
  cep_end: string;

  @ApiProperty()
  total_ceps: number;

  @ApiProperty()
  processed: number;

  @ApiProperty()
  success: number;

  @ApiProperty()
  errors: number;

  @ApiProperty({ enum: ['pending', 'running', 'finished', 'failed'] })
  status: 'pending' | 'running' | 'finished' | 'failed';

  @ApiProperty()
  progress_percentage: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ required: false })
  started_at?: Date;

  @ApiProperty({ required: false })
  finished_at?: Date;
}
