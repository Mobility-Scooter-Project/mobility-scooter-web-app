import { pub } from "@src/integrations/queue";
import { videoRepository } from "@src/repositories/video";

interface S3UserIdentity {
    principalId: string;
}

interface S3RequestParameters {
    principalId: string;
    region: string;
    sourceIPAddress: string;
}

interface S3ResponseElements {
    'x-amz-id-2': string;
    'x-amz-request-id': string;
    'x-minio-deployment-id': string;
    'x-minio-origin-endpoint': string;
}

interface S3Bucket {
    name: string;
    ownerIdentity: S3UserIdentity;
    arn: string;
}

interface S3Object {
    key: string;
    size: number;
    eTag: string;
    contentType: string;
    userMetadata: {
        'content-type': string;
    };
    sequencer: string;
}

interface S3Source {
    host: string;
    port: string;
    userAgent: string;
}

interface S3Record {
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    eventTime: string;
    eventName: string;
    userIdentity: S3UserIdentity;
    requestParameters: S3RequestParameters;
    responseElements: S3ResponseElements;
    s3: {
        s3SchemaVersion: string;
        configurationId: string;
        bucket: S3Bucket;
        object: S3Object;
    };
    source: S3Source;
}

export interface UploadVideoPayload {
    EventName: 's3:ObjectCreated:Put';
    Key: string;
    Records: S3Record[];
}