import { TOPICS } from "@shared/config/topics";
import { queue } from "@integrations/queue";
import { eventHandlers } from "./handlers/events";

while (!queue.getConnectionStatus()) {
    console.log("Waiting for RabbitMQ connection...");
    await new Promise((resolve) => setTimeout(resolve, 6000));
}
console.log("RabbitMQ connection established.");

const eventSubscriber = queue.createConsumer({ queue: TOPICS.EVENTS, queueOptions: { durable: true } }, eventHandlers.consumeEvent);