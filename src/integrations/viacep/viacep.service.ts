import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { IViaCepService, ViaCepResponse } from './viacep.service.interface';

@Injectable()
export class ViaCepService implements IViaCepService {
  private client: AxiosInstance;
  private readonly logger = new Logger(ViaCepService.name);

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('VIA_CEP_BASE_URL', 'https://viacep.com.br/ws');
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
    });
  }

  async consultarCep(cep: string): Promise<ViaCepResponse | null> {
    try {
      const response = await this.client.get(`/${cep}/json`);

      if (response.data.erro) {
        return null;
      }

      return response.data as ViaCepResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          this.logger.warn(`Rate limit atingido para CEP ${cep}`);
          throw new Error('RATE_LIMIT_EXCEEDED');
        }
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('TIMEOUT');
        }
        throw new Error(`HTTP_ERROR:${axiosError.response?.status || 'UNKNOWN'}`);
      }
      throw error;
    }
  }
}
