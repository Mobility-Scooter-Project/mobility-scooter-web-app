import { EXCHANGES, TOPICS } from "@shared/config/queue";
import { queue } from "@integrations/queue";
import { eventHandlers } from "./handlers/events";
import logger from "@shared/utils/logger";

while (!queue.getConnectionStatus()) {
    logger.debug("Waiting for RabbitMQ connection...");
    await new Promise((resolve) => setTimeout(resolve, 7000));
}

logger.debug("RabbitMQ connection established");

const eventSubscriber = queue.createConsumer(
    {
        queue: TOPICS.EVENTS,
        queueOptions: { durable: true },
        exchanges: [{ exchange: EXCHANGES.STORAGE, type: "direct" }],
    },
    eventHandlers.consumeEvent
);

logger.info("Consumer started");