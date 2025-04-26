import { Queue } from "@shared/integrations/queue";

export const queue = new Queue(Error("Failed to connect to RabbitMQ"));
