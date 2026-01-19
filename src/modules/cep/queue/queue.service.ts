import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  CreateQueueCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { IQueueService, QueueMessage, ReceivedMessage } from './queue.service.interface';

@Injectable()
export class QueueService implements IQueueService, OnModuleInit {
  private sqs: SQSClient;
  private queueUrl: string;
  private queueName: string;
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('QUEUE_URL', 'http://localhost:9324');
    this.queueName = this.configService.get<string>('QUEUE_NAME', 'cep-queue');

    this.sqs = new SQSClient({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'x',
        secretAccessKey: 'x',
      },
    });
  }

  async onModuleInit() {
    await this.ensureQueueExists();
  }

  private async ensureQueueExists(): Promise<void> {
    try {
      const getUrlCommand = new GetQueueUrlCommand({ QueueName: this.queueName });
      const response = await this.sqs.send(getUrlCommand);
      this.queueUrl = response.QueueUrl!;
      this.logger.log(`Fila encontrada: ${this.queueUrl}`);
    } catch {
      this.logger.log(`Criando fila: ${this.queueName}`);
      const createCommand = new CreateQueueCommand({
        QueueName: this.queueName,
        Attributes: {
          VisibilityTimeout: '120',
          ReceiveMessageWaitTimeSeconds: '20',
        },
      });
      const response = await this.sqs.send(createCommand);
      this.queueUrl = response.QueueUrl!;
      this.logger.log(`Fila criada: ${this.queueUrl}`);
    }
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    });
    await this.sqs.send(command);
  }

  async sendMessages(messages: QueueMessage[]): Promise<void> {
    const batches = this.chunkArray(messages, 10);

    for (const batch of batches) {
      const entries = batch.map((msg, index) => ({
        Id: `msg-${index}`,
        MessageBody: JSON.stringify(msg),
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: entries,
      });

      await this.sqs.send(command);
    }
  }

  async receiveMessages(maxMessages: number = 10): Promise<ReceivedMessage[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Math.min(maxMessages, 10),
      WaitTimeSeconds: 20,
      VisibilityTimeout: 120,
    });

    const response = await this.sqs.send(command);

    if (!response.Messages) {
      return [];
    }

    return response.Messages.map((msg) => {
      const body = JSON.parse(msg.Body || '{}') as QueueMessage;
      return {
        ...body,
        receiptHandle: msg.ReceiptHandle!,
      };
    });
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.sqs.send(command);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
