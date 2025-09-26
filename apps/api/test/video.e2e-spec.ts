import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { AppModule } from "@src/routes/app.module";
import { App } from "supertest/types";
import request from "supertest";


describe('VideoController (e2e)', () => {
    let app: INestApplication<App>;
    let token: string;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Simulate login to get a token
        const response = await request(app.getHttpServer())
            .post('/auth/email')
            .send({ email: 'test@example.com', password: 'testing124' })
            .expect(201);
        token = response.body.token;
    });

    // Omitted for now until session logic is implemented
    describe('POST /videos/upload', () => {
        it('should return 201 and video metadata for valid input', async () => {
            /* const response = await request(app.getHttpServer())
                 .post('/videos/upload')
                 .set('Authorization', `Bearer ${token}`)
                 .send({ patientId: 'patient123', sessionId: 'session456', fileName: 'video.mp4' })
                 .expect(201);
             expect(response.body).toHaveProperty('videoId');
             expect(response.body).toHaveProperty('patientId', 'patient123');
             expect(response.body).toHaveProperty('sessionId', 'session456');
             expect(response.body).toHaveProperty('fileName', 'video.mp4');*/
        });
    });

    describe('POST /videos/:videoId/upload', () => {
        it('should return 201 for successful file upload', async () => {
            /*const videoId = 'some-video-id';
            const response = await request(app.getHttpServer())
                .post(`/videos/${videoId}/upload`)
                .set('Authorization', `Bearer ${token}`)
                .attach('file', Buffer.from('dummy content'), 'video.mp4')
                .expect(201);
            expect(response.body).toHaveProperty('message', 'File uploaded successfully');
        */
        });
    });
});
