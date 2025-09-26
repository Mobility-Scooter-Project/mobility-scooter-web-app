import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { AppConfig } from 'src/config';

@Injectable()
export class QueueService {
  private client: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.client = new Kafka({
      clientId: 'api',
      brokers: [this.configService.get('broker').url],
      logCreator:
        () =>
        ({ namespace, level, label, log }) => {
          switch (level) {
            case 1:
              this.logger.error(
                `[${label}] ${log.message} ${JSON.stringify(log.payload)}`,
              );
              break;
            case 2:
              this.logger.warn(
                `[${label}] ${log.message} ${JSON.stringify(log.payload)}`,
              );
              break;
            case 4:
              this.logger.debug(
                `[${label}] ${log.message} ${JSON.stringify(log.payload)}`,
              );
              break;
            case 5:
              this.logger.verbose(
                `[${label}] ${log.message} ${JSON.stringify(log.payload)}`,
              );
              break;
            default:
              this.logger.log(
                `[${label}] ${log.message} ${JSON.stringify(log.payload)}`,
              );
              break;
          }
        },
    });
    this.producer = this.client.producer();
  }

  public static async build(
    configService: ConfigService<AppConfig>,
  ): Promise<QueueService> {
    const queue = new QueueService(configService);
    await queue.producer.connect();
    return queue;
  }

  public getProducer(): Producer {
    return this.producer;
  }
}
