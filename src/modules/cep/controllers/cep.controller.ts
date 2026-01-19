import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateCrawlService } from '../services/crawl/create-crawl.service';
import { GetCrawlStatusService } from '../services/crawl/get-crawl-status.service';
import { GetCrawlResultsService } from '../services/crawl/get-crawl-results.service';
import { CreateCrawlRequestDto } from '../dtos/create-crawl.request.dto';
import { CreateCrawlResponseDto } from '../dtos/create-crawl.response.dto';
import { CrawlStatusResponseDto } from '../dtos/crawl-status.response.dto';
import { CrawlResultsResponseDto } from '../dtos/crawl-results.response.dto';

@ApiTags('cep')
@Controller('cep')
export class CepController {
  constructor(
    private readonly createCrawlService: CreateCrawlService,
    private readonly getCrawlStatusService: GetCrawlStatusService,
    private readonly getCrawlResultsService: GetCrawlResultsService,
  ) {}

  @Post('crawl')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar processamento de range de CEPs' })
  @ApiResponse({
    status: 202,
    type: CreateCrawlResponseDto,
    description: 'Requisição aceita para processamento',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCrawl(
    @Body() data: CreateCrawlRequestDto,
  ): Promise<CreateCrawlResponseDto> {
    return this.createCrawlService.execute(data);
  }

  @Get('crawl/:crawl_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar status do processamento' })
  @ApiResponse({
    status: 200,
    type: CrawlStatusResponseDto,
    description: 'Status do crawl',
  })
  @ApiResponse({ status: 404, description: 'Crawl não encontrado' })
  async getCrawlStatus(
    @Param('crawl_id') crawlId: string,
  ): Promise<CrawlStatusResponseDto> {
    return this.getCrawlStatusService.execute(crawlId);
  }

  @Get('crawl/:crawl_id/results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar resultados do processamento' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    type: CrawlResultsResponseDto,
    description: 'Resultados do crawl',
  })
  @ApiResponse({ status: 404, description: 'Crawl não encontrado' })
  async getCrawlResults(
    @Param('crawl_id') crawlId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CrawlResultsResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.getCrawlResultsService.execute(crawlId, pageNum, limitNum);
  }
}
