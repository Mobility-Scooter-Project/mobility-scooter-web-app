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
        qos: {
            prefetchCount: 1,
        },
        queueOptions: {
            queue: TOPICS.KEYPOINTS,
            durable: true,
            autoDelete: false,
            exclusive: false
        },
        exchanges: [{
            exchange: EXCHANGES.STORAGE,
            durable: true,
            passive: false,
            type: "direct",
        }],
        queueBindings: [{
            exchange: EXCHANGES.STORAGE,
            queue: TOPICS.KEYPOINTS,
            routingKey: "keypoints.*",
        }]

    },
    eventHandlers.consumeEvent
);

eventSubscriber.start();

const endTime = Date.now();
logger.debug(`RabbitMQ consumer started in ${endTime - startTime}ms`);