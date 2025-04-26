import { kv } from "../../../src/integrations/kv"
import presignedUrl from "./presigned-url";

export default () => describe("Storage", () => {
    beforeEach(async () => {
        await kv.flushall();
    });

    presignedUrl();

    afterAll(async () => {
        await Promise.all([
            kv.flushall(),
        ]);
    });
});