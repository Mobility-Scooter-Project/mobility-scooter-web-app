import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { AppConfig } from '@config/constants';

/**
 * QueueService provides methods to interact with a Kafka message broker.
 *
 * This service manages the Kafka producer lifecycle and provides access to the producer instance.
 */
@Injectable()
export class QueueService implements OnApplicationShutdown {
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

  /**
   *  Get the Kafka producer instance
   * @returns The Kafka producer instance
   */
  public getProducer(): Producer {
    return this.producer;
  }

  /**
   *  Handle application shutdown to gracefully disconnect the Kafka producer
   *
   * @param signal The shutdown signal
   */
  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutdown signal received: ${signal}`);
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }
}
