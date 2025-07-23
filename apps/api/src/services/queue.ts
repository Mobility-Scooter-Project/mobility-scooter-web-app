import { Kafka, Producer } from "kafkajs";
import { BROKER_URL } from "@src/config/constants";
// @ts-ignore
import { injectable } from "inversify";

@injectable()
export class QueueService {
    private instance!: Kafka;
    public producer!: Producer;

    private constructor() { }

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