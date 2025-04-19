import { QUEUE_URL } from "@src/config/constants";
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

    private constructor() { }
    /**
     * Returns a singleton instance of the Connection class.
     * @returns {Connection} The singleton instance of the Connection class.
     */
    public static getInstance(): Connection {
        if (!this.instance) {
            try {
                // this will automatically retry if the connection fails up to 20 times
                this.instance = new Connection(QUEUE_URL);
            } catch (error) {
                console.error("Failed to connect to RabbitMQ:", error);
            }
        }
        return this.instance;
    }
}

const queue = Queue.getInstance();

export const pub = queue.createPublisher({
    confirm: true,
});
