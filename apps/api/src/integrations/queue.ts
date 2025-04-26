import { Queue } from "@shared/integrations/queue"
import { HTTPError } from "@src/lib/errors"

export const queue = new Queue(new HTTPError(500, "Failed to connect to RabbitMQ"));