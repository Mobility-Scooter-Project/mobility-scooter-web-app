import container, { KVSymbol } from "@src/lib/container";
import presignedUrl from "./presigned-url";
import Redis from "ioredis";


export default () => describe("Storage", () => {
    beforeEach(async () => {
        const kv = await container.getAsync<Redis>(KVSymbol);
        await kv.flushall();
    });

    presignedUrl();

    afterAll(async () => {
        const kv = await container.getAsync<Redis>(KVSymbol);
        await kv.flushall();
    });
});