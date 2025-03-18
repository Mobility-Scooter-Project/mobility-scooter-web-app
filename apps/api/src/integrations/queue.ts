import { QUEUE_URL } from '@src/config/constants'
import { Connection } from 'rabbitmq-client'

const queue = new Connection(QUEUE_URL)

export const pub = queue.createPublisher({ confirm: true })
