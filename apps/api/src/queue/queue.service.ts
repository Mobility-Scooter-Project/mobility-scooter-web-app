import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { AppConfig } from 'src/config';

@Injectable()
export class QueueService {
    private client: Kafka;
    private producer: Producer;

    private constructor(private readonly configService: ConfigService<AppConfig>) {
        this.client = new Kafka({
            clientId: 'api',
            brokers: [this.configService.get("broker").url],
        });
        this.producer = this.client.producer();
    }

    public static async build(configService: ConfigService<AppConfig>): Promise<QueueService> {
        const queue = new QueueService(configService);
        await queue.producer.connect();
        return queue;
    }

    public getProducer(): Producer {
        return this.producer;
    }
}
