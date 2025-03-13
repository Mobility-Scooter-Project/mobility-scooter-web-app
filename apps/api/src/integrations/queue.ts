import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxRetriesPerRequest: null })

export const videoProcessingQueue = new Queue('video-processing', { connection });

const worker = new Worker(
    'video-processing',
    async job => {
        console.log(job.data);
    },
    { connection },
);