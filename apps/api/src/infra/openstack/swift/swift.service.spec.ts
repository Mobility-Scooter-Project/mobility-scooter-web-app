import { Test, TestingModule } from '@nestjs/testing';
import { SwiftService } from './swift.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '@config/constants';
import { S3Service } from '../s3/s3.service';

describe('SwiftService', () => {
  let service: SwiftService;
  let s3: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        HttpModule,
      ],
      providers: [S3Service, SwiftService],
    }).compile();

    service = module.get<SwiftService>(SwiftService);
    s3 = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('putObjectStream', () => {
    it('should upload a file stream', async () => {
      const filePath = 'test-folder/test-file.txt';
      const fileContent = 'Hello, Swift!';
      const stream = require('stream');
      const readableStream = new stream.Readable();
      readableStream.push(fileContent);
      readableStream.push(null); // No more data

      jest.spyOn(s3, 'getOrCreateBucket').mockResolvedValue();

      await service.putObjectStream(filePath, readableStream);

      expect(s3.getOrCreateBucket).toHaveBeenCalledWith(
        service['storageBucket'],
      );
    });
  });
});
