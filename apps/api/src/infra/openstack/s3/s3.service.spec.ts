import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import config from '@config/constants';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        HttpModule,
      ],
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // again, these are technically integration tests since they hit real OpenStack services, but mocking the S3 client is also out of scope for now.
  describe('bucketExists', () => {
    it('should return false for a non-existent bucket', async () => {
      const exists = await service.bucketExists(
        'this-bucket-should-not-exist-12345',
      );
      expect(exists).toBe(false);
    });

    it('should return true for an existing bucket', async () => {
      const exists = await service.bucketExists('dev');
      expect(exists).toBe(true);
    });
  });

  // makeBucket is omitted as there are only 2 buckets, dev and prod, and deleting buckets is not an actual function of the s3 service.

  describe('getOrCreateBucket', () => {
    it('should return an existing bucket', async () => {
      await service.getOrCreateBucket('dev');
      const status = await service.bucketExists('dev');
      expect(status).toBe(true);
    });
  });

  describe('presignendUrl', () => {
    let url: string;
    it('should generate a presigned URL for an existing bucket', async () => {
      url = await service.presignedUrl('GET', 'test-object', 60 * 60 * 24); // 1 hour from now in seconds
      expect(url).toBeDefined();
      expect(url).toContain('http');
    });
  });

  // multipart upload and waitUntilObjectExists are not tested as it requires a real object to upload, which is out of scope for now.
});
