import { AsyncMessage, MessageBody, Envelope, ConsumerStatus } from "rabbitmq-client";

const consumeEvent = async (msg: AsyncMessage, reply: (body: MessageBody, envelope?: Envelope) => Promise<void>): Promise<ConsumerStatus | void> => {
    console.log("Event consumed", msg);
}


export const eventHandlers = {
    consumeEvent
}