import { Queue, Worker } from 'bullmq';
import { kv } from './kv';

export const videoProcessingQueue = new Queue('video-processing', { connection: kv });

const worker = new Worker(
    'video-processing',
    async job => {
        console.log(job.data);
    },
    { connection: kv },
);