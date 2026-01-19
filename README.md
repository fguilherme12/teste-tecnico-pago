# CEP Crawler - Teste Técnico

Crawler assíncrono de CEPs com fila e MongoDB.

## Tecnologias

- Node.js 22
- NestJS 10
- MongoDB 7
- ElasticMQ (compatível com SQS)
- TypeScript
- Docker

## Arquitetura

```
src/
├── modules/cep/          # Módulo de domínio
│   ├── controllers/      # Endpoints REST
│   ├── services/         # Lógica de negócio
│   ├── repositories/     # Acesso a dados
│   ├── dtos/             # Objetos de transferência
│   └── queue/            # Serviço de fila
├── integrations/         # Integrações externas
│   └── viacep/           # Integração com ViaCEP
├── workers/              # Workers de processamento
│   └── cep-processor/    # Worker de CEPs com rate limiter
├── database/             # Módulo de banco de dados
└── common/               # Módulos compartilhados
```

## Executando com Docker

```bash
docker-compose up --build
```

Serviços:
- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- MongoDB: localhost:27017
- ElasticMQ: localhost:9324

## Executando Localmente

### Pré-requisitos

- Node.js 20+
- MongoDB rodando
- ElasticMQ rodando

### Instalação

```bash
npm install
```

### Configuração

Copie `env.example` para `.env` e ajuste as variáveis.

### Executar API

```bash
npm run start:dev
```

### Executar Worker

```bash
npm run worker:dev
```

## API Endpoints

### POST /cep/crawl

Solicita processamento de um range de CEPs.

```json
{
  "cep_start": "01000000",
  "cep_end": "01000100"
}
```

Resposta (202 Accepted):
```json
{
  "crawl_id": "abc123",
  "total_ceps": 101,
  "message": "Crawl iniciado com sucesso"
}
```

### GET /cep/crawl/:crawl_id

Consulta status do processamento.

Resposta:
```json
{
  "crawl_id": "abc123",
  "cep_start": "01000000",
  "cep_end": "01000100",
  "total_ceps": 101,
  "processed": 50,
  "success": 45,
  "errors": 5,
  "status": "running",
  "progress_percentage": 50,
  "created_at": "2025-01-15T10:00:00Z",
  "started_at": "2025-01-15T10:00:01Z"
}
```

### GET /cep/crawl/:crawl_id/results

Consulta resultados paginados.

Query params:
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 20)

## Rate Limiting

O sistema implementa controle robusto de taxa de requisições:

1. **Limite de requisições por segundo**: Configurável via `RATE_LIMIT_REQUESTS_PER_SECOND`
2. **Controle de concorrência**: Máximo de requisições simultâneas via `WORKER_CONCURRENCY`
3. **Backoff adaptativo**: Aumenta automaticamente o intervalo quando detecta rate limit
4. **Retry com backoff exponencial**: Retenta erros temporários com delays crescentes

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| MONGODB_URI | URI do MongoDB | mongodb://localhost:27017/cep-crawler |
| QUEUE_URL | URL do ElasticMQ | http://localhost:9324 |
| QUEUE_NAME | Nome da fila | cep-queue |
| VIA_CEP_BASE_URL | URL base do ViaCEP | https://viacep.com.br/ws |
| RATE_LIMIT_REQUESTS_PER_SECOND | Requisições por segundo | 3 |
| WORKER_CONCURRENCY | Concorrência do worker | 2 |
| MAX_RETRIES | Máximo de retentativas | 3 |

## Testes

```bash
npm test
```
