import logger from "@shared/utils/logger";
import { AsyncMessage, MessageBody, Envelope, ConsumerStatus } from "rabbitmq-client";

const consumeEvent = async (msg: AsyncMessage, reply: (body: MessageBody, envelope?: Envelope) => Promise<void>): Promise<ConsumerStatus | void> => {
    logger.info("Event received", msg);
}


export const eventHandlers = {
    consumeEvent
}