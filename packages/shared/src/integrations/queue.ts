import { Connection } from "rabbitmq-client";
import { QUEUE_URL } from "src/config/constants";

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

    public constructor(ErrorObject: any) {
        {
            if (!Queue.instance) {
                try {
                    setTimeout(() => {
                        Queue.instance = new Connection(QUEUE_URL);
                        Queue.publisher = Queue.instance.createPublisher({ confirm: true });
                        Queue.errorObject = ErrorObject;
                    }
                        , 6000);
                } catch (error) {
                    console.error("Failed to connect to RabbitMQ:", error);
                }
            }
        }
    }

    /**
     * Publishes a message to a RabbitMQ topic.
     * @param topic - The routing key/topic to publish the message to
     * @param message - The message payload to publish
     * @throws {HTTPError} When the message fails to publish to RabbitMQ
     * @returns {Promise<void>}
     */
    public async publish(topic: string, message: any) {
        try {
            await Queue.publisher.send(topic, message);
        } catch (error) {
            throw Queue.errorObject;
        }
    }
}