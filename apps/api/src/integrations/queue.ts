import { QUEUE_URL } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { Connection } from "rabbitmq-client";

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

    public constructor() {
        if (!Queue.instance) {
            try {
                setTimeout(() => {
                    Queue.instance = new Connection(QUEUE_URL);
                    Queue.publisher = Queue.instance.createPublisher({ confirm: true });
                }
                    , 6000);
            } catch (error) {
                console.error("Failed to connect to RabbitMQ:", error);
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
            throw new HTTPError(
                HTTP_CODES.INTERNAL_SERVER_ERROR,
                error,
                "Failed to publish message to RabbitMQ",
            );
        }
    }
}

export const queue = new Queue();