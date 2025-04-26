import { Queue } from "@shared/integrations/queue";

export const queue = new Queue(new Error("Failed to connect to RabbitMQ"));
