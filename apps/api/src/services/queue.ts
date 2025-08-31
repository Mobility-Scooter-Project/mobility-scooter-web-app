import { Kafka, Producer } from "kafkajs";
import { BROKER_URL } from "@src/config/constants";
// @ts-ignore
import { injectable } from "inversify";

@injectable()
export class QueueService {
    private instance!: Kafka;
    public producer!: Producer;

    private constructor() { }

    /**
     * Builds and initializes a new QueueService instance with Kafka configuration.
     * 
     * Creates a Kafka client with the specified broker URL and retry settings,
     * initializes a producer, and establishes a connection to the Kafka cluster.
     * 
     * @returns A Promise that resolves to a configured QueueService instance
     * @throws May silently handle connection errors and continue with unconnected service
     * 
     * @example
     * ```typescript
     * const queueService = await QueueService.build();
     * ```
     */
    public static async build() {
        const queueService = new QueueService();
        const kafka = new Promise(async (resolve) => {
            try {
                queueService.instance = new Kafka({
                    clientId: 'api',
                    brokers: [BROKER_URL],
                    retry: {
                        initialRetryTime: 5000
                    }
                });
                queueService.producer = queueService.instance.producer();
                await queueService.producer.connect();
                resolve(true)
            } catch (error) {
                resolve(false);
            }
        });

        await kafka;

        return queueService;
    }
}