import { EXCHANGES, TOPICS } from "@shared/config/queue";
import { queue } from "@integrations/queue";
import { eventHandlers } from "./handlers/events";
import logger from "@shared/utils/logger";


const startTime = Date.now();
logger.info("Starting RabbitMQ consumer...");

while (!queue.getConnectionStatus()) {
    logger.debug("Waiting for RabbitMQ connection...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
}

logger.debug("RabbitMQ connection established");

const eventSubscriber = queue.createConsumer(
    {
        queue: TOPICS.KEYPOINTS,
        queueOptions: { durable: true },
        exchanges: [{ exchange: EXCHANGES.STORAGE, type: "direct" }],
    },
    eventHandlers.consumeEvent
);

const endTime = Date.now();
logger.debug(`RabbitMQ consumer started in ${endTime - startTime}ms`);