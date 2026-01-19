export interface IQueueService {
  sendMessage(message: QueueMessage): Promise<void>;
  sendMessages(messages: QueueMessage[]): Promise<void>;
  receiveMessages(maxMessages?: number): Promise<ReceivedMessage[]>;
  deleteMessage(receiptHandle: string): Promise<void>;
}

export interface QueueMessage {
  crawl_id: string;
  cep: string;
}

export interface ReceivedMessage extends QueueMessage {
  receiptHandle: string;
}
