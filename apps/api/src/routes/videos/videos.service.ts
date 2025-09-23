import { HttpException, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, DbService } from 'src/infra/db/db.service';
import { events, fileMetadata } from 'src/infra/db/schema/storage';
import { S3Service } from 'src/infra/openstack/s3/s3.service';
import { SwiftService } from 'src/infra/openstack/swift/swift.service';
import { QueueService } from 'src/infra/queue/queue.service';
import { Readable } from 'stream';

@Injectable()
export class VideosService {
    private objectStorage: SwiftService;
    private db: DB;
    private queue: QueueService;
    private s3: S3Service;
    private logger = new Logger(VideosService.name);

    constructor(
        private readonly swiftService: SwiftService,
        private readonly dbService: DbService,
        private readonly queueService: QueueService,
        private readonly s3service: S3Service,
    ) {
        this.objectStorage = swiftService;
        this.db = dbService.db;
        this.queue = queueService;
        this.s3 = s3service;
    }

    async createVideoMetadata(patientId: string, sessionId: string, fileName: string) {
        const path = `patients/${patientId}/sessions/${sessionId}/${fileName}`;

        let result;
        try {
            result = await this.db.transaction(async (tx) => {
                const event = await tx.insert(events).values({
                }).returning();

                return await tx.insert(fileMetadata).values({
                    patientId,
                    statusEventId: event[0].id,
                    path,
                    uploadedAt: new Date(),
                }).returning();
            });
        } catch (error) {
            this.logger.error('Error creating video metadata', error);
            throw new HttpException('Error creating video metadata', 500);
        }

        return { id: result[0].id };
    }


    async uploadVideo(videoId: string, file: Express.Multer.File) {
        let video;
        try {
            video = await this.db.select()
                .from(fileMetadata)
                .where(eq(fileMetadata.id, videoId)).limit(1);
        } catch (error) {
            this.logger.error('Error fetching video metadata', error);
            throw new HttpException(`Invalid input`, 400);
        }

        if (!video[0]) {
            throw new HttpException('Video not found', 404);
        }


        const filePath = video[0].path;
        const objectFilePath = `${video[0].patientId}/${filePath}`;

        // Convert buffer to readable stream since multer stores file as buffer
        if (!file.buffer) {
            throw new HttpException('No file buffer found', 400);
        }

        const fileStream = Readable.from(file.buffer);

        await this.objectStorage.putObjectStream(objectFilePath, fileStream, new Date(), file.mimetype);

        const transcriptPath = filePath.replace(/\.mp4$/, ".vtt");
        const videoDataPromise = this.objectStorage.generatePresignedGetUrl(filePath);

        const expires = 60 * 60 * 24;

        const transcriptPutUrlPromise = this.s3.presignedUrl(
            "PUT",
            transcriptPath,
            expires,
        );

        const [videoUrl, transcriptPutUrl] = await Promise.all([
            videoDataPromise,
            transcriptPutUrlPromise,
        ]);

        /*let uploadState = await this.s3.waitUntilObjectExists(filePath);

        while (uploadState.state !== 'SUCCESS') {
            if (uploadState.state === 'FAILURE') {
                throw new HttpException("Failed to upload video file", 500);
            }
            uploadState = await this.s3.waitUntilObjectExists(filePath);
        }*/

        await this.queue.getProducer().send({
            topic: "videos",
            messages: [{
                key: videoId,
                value: JSON.stringify({
                    id: videoId,
                    url: videoUrl,
                    filename: filePath,
                    transcriptPutUrl,
                }),
            }],
        });
    }

    async getVideoPresignedUrl(videoId: string): Promise<string> {
        let video;
        try {
            video = await this.db.select()
                .from(fileMetadata)
                .where(eq(fileMetadata.id, videoId))
        } catch (error) {
            this.logger.error('Error fetching video metadata', error);
            throw new HttpException(`Invalid input`, 400);
        }

        if (!video[0]) {
            throw new HttpException('Video not found', 404);
        }

        const objectFilePath = `${video[0].patientId}/${video[0].path}`;

        return await this.objectStorage.generatePresignedGetUrl(objectFilePath);
    }
}
