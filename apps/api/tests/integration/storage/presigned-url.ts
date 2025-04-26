import { SHARED_LOGIN } from "@tests/config/constants";
import { getClientWithHeaders } from "@tests/lib/client";
import * as fs from "fs";
import { client as unauthenticatedClient } from "@tests/lib/client";
import { Storage } from "@src/integrations/storage";

const SHARED_DATA = {
    bucketName: "test-bucket",
    filePath: "test-file.txt",
};

export default () => describe("Presigned URL", () => {
    let USER_JWT: string;
    let client: ReturnType<typeof getClientWithHeaders>;
    let presignedUrl: string;

    beforeAll(async () => {
        const res = await unauthenticatedClient.api.v1.auth.emailpass.$post({
            json: SHARED_LOGIN,
        });

        const { data, error } = await res.json();
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data.token).not.toBeNull();

        USER_JWT = data.token;
        client = getClientWithHeaders({
            "X-User": USER_JWT,
        });
    });

    it("should upload a file to object storage", async () => {

        const body = fs.readFileSync(`${__dirname}/test-file.txt`);

        const res = await client.api.v1.storage[":bucketName"][":filePath"].$put({
            param: SHARED_DATA,
        }, {
            init: {
                body,
            }
        });

        expect(res.status).toBe(200);

        const { data, error } = await res.json();
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data.success).toBe(true);
    });

    it("should generate a presigned URL for downloading a file", async () => {

        const res = await client.api.v1.storage["presigned-url"].$post({
            json: SHARED_DATA,
        });
        const { data, error } = await res.json();
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data.url).not.toBeNull();
        expect(res.status).toBe(200);
        presignedUrl = data.url;
    });

    it("should download a file from the presigned URL", async () => {
        const res = await fetch(presignedUrl, {
            method: "GET"
        });
        expect(res.status).toBe(200);
        const blob = await res.blob();
        expect(blob).not.toBeNull();
    });

    it("should return 401 when using an invalid presigned URL", async () => {
        const url = presignedUrl.replace("test-bucket", "invalid-bucket");
        const response = await fetch(url, {
            method: "GET"
        });
        expect(response.status).toBe(401);
    });

    afterAll(async () => {
        await Storage.instance.removeObject(
            "test-bucket",
            "test-file.txt",
        )
    });
});