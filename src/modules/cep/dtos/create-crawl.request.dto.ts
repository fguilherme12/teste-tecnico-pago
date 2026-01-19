import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrawlRequestDto {
  @ApiProperty({
    description: 'CEP inicial do range',
    example: '01000000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'cep_start deve conter exatamente 8 dígitos' })
  cep_start: string;

  @ApiProperty({
    description: 'CEP final do range',
    example: '01001000',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'cep_end deve conter exatamente 8 dígitos' })
  cep_end: string;
}
