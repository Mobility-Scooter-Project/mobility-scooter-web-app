import { Connection } from "rabbitmq-client";
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
    private static isConnected = false;

    public constructor(ErrorObject: any) {
        {
            if (!Queue.instance) {
                try {
                    setTimeout(() => {
                        Queue.instance = new Connection(QUEUE_URL);
                        Queue.publisher = Queue.instance.createPublisher({ confirm: true });;
                        Queue.errorObject = ErrorObject;
                        Queue.isConnected = true;
                        console.log("Connected to RabbitMQ");
                    }
                        , 6000);
                } catch (error) {
                    Queue.isConnected = false;
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
    public getConnectionStatus() {
        if (!Queue.instance) {
            return false;
        }
        return Queue.isConnected;
    }
}