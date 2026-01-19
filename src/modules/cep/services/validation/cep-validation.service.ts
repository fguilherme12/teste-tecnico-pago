import { Injectable } from '@nestjs/common';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable()
export class CepValidationService {
  private readonly MAX_RANGE_SIZE = 10000;

  validateCepFormat(cep: string): boolean {
    return /^\d{8}$/.test(cep);
  }

  validateRange(cepStart: string, cepEnd: string): ValidationResult {
    if (!this.validateCepFormat(cepStart)) {
      return { valid: false, error: 'cep_start deve conter exatamente 8 dígitos' };
    }

    if (!this.validateCepFormat(cepEnd)) {
      return { valid: false, error: 'cep_end deve conter exatamente 8 dígitos' };
    }

    const startNum = parseInt(cepStart, 10);
    const endNum = parseInt(cepEnd, 10);

    if (startNum > endNum) {
      return { valid: false, error: 'cep_start deve ser menor ou igual a cep_end' };
    }

    const rangeSize = endNum - startNum + 1;
    if (rangeSize > this.MAX_RANGE_SIZE) {
      return {
        valid: false,
        error: `Range muito grande. Máximo permitido: ${this.MAX_RANGE_SIZE} CEPs`,
      };
    }

    return { valid: true };
  }

  generateCepRange(cepStart: string, cepEnd: string): string[] {
    const startNum = parseInt(cepStart, 10);
    const endNum = parseInt(cepEnd, 10);
    const ceps: string[] = [];

    for (let i = startNum; i <= endNum; i++) {
      ceps.push(i.toString().padStart(8, '0'));
    }

    return ceps;
  }

  getRangeSize(cepStart: string, cepEnd: string): number {
    const startNum = parseInt(cepStart, 10);
    const endNum = parseInt(cepEnd, 10);
    return endNum - startNum + 1;
  }
}
