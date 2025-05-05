import { Kafka, logLevel, Producer } from "kafkajs";
import { HTTPError } from "@src/lib/errors";
import { BROKER } from "@src/config/constants";
// @ts-ignore
import * as PinoLogCreator from "@mia-platform/kafkajs-pino-logger"


/**
 * A singleton class that manages the connection to a message queue (RabbitMQ).
 * Provides a centralized way to access the queue connection throughout the application.
 * 
 * @class Queue
 * @static
 * @example
 * ```typescript
 * const queue = Queue.getInstance();
 * ```
 */
export class Queue {
    private instance!: Kafka;
    public producer!: Producer;
    private connectionPromise: Promise<boolean>;

    public constructor() {
        this.connectionPromise = new Promise(async (resolve) => {
            try {
                this.instance = new Kafka({
                    clientId: 'api',
                    brokers: [BROKER],
                    retry: {
                        initialRetryTime: 1000
                    }
                });
                this.producer = this.instance.producer();
                await this.producer.connect();
                resolve(true)
            } catch (error) {
                resolve(false);
            }
        })


    }

    /**
     * Retrieves the connection status of the Queue.
     *
     * @returns {boolean} True if the Queue is connected, false otherwise.
     */
    public async getConnectionStatus() {
        if (!this.connectionPromise) {
            return false;
        }
        return await this.connectionPromise;
    }
}

export const queue = new Queue();