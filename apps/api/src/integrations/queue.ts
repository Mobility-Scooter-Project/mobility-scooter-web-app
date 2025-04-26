import { QUEUE_URL } from "@src/config/constants"
import { Queue } from "@shared/integrations/queue"
import { HTTPError } from "@src/lib/errors"

export const queue = new Queue(QUEUE_URL, new HTTPError(500, "Failed to connect to RabbitMQ"));