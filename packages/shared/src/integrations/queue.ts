import { Connection, MessageBody } from "rabbitmq-client";
import { QUEUE_URL } from "../config/constants";

type QueueConsumer = Parameters<Connection["createConsumer"]>;

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
    private static instance: Connection;
    private static publisher: ReturnType<Connection["createPublisher"]>;
    private static errorObject: any;
    private static connectionPromise: Promise<boolean>;

    public constructor(ErrorObject: any) {
        {
            if (!Queue.instance) {
                Queue.errorObject = ErrorObject;
                Queue.connectionPromise = new Promise((resolve) => {
                    try {
                        Queue.instance = new Connection(QUEUE_URL);
                        Queue.instance.on("error", (error) => {
                            Queue.errorObject = error;
                            resolve(false);
                        });
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                    }
                })
            }
        }
    }

    /**
     * Publishes a message to a RabbitMQ topic.
     * @param topic - The routing key/topic to publish the message to
     * @param body - The message payload to publish
     * @throws {HTTPError} When the message fails to publish to RabbitMQ
     * @returns {Promise<void>}
     */
    public async publish(topic: string, body: MessageBody) {
        try {
            await Queue.publisher.send(topic, body);
        } catch (error) {
            throw Queue.errorObject;
        }
    }

    /**
     * Creates a consumer for the queue using the specified properties and callback.
     *
     * @param props - The properties required to configure the consumer.
     * @param cb - The callback function that processes queue events.
     * @returns A consumer instance linked to the Queue.
     */
    public createConsumer(props: QueueConsumer['0'], cb: QueueConsumer['1']) {
        return Queue.instance.createConsumer(props, cb);
    }

    /**
     * Retrieves the connection status of the Queue.
     *
     * @returns {boolean} True if the Queue is connected, false otherwise.
     */
    public async getConnectionStatus() {
        if (!Queue.connectionPromise) {
            return false;
        }
        return await Queue.connectionPromise;
    }
}