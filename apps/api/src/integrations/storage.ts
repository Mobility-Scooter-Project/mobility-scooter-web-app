import { ENVIRONMENT, STORAGE_ACCESS_KEY, STORAGE_PORT, STORAGE_SECRET_KEY, STORAGE_URL } from '@src/config/constants';
import { Client } from 'minio'

export const storage = new Client({
    endPoint: STORAGE_URL,
    port: Number(STORAGE_PORT),
    useSSL: ENVIRONMENT !== 'development' && ENVIRONMENT !== 'test',
    accessKey: STORAGE_ACCESS_KEY,
    secretKey: STORAGE_SECRET_KEY
});