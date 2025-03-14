import { kv } from "@src/integrations/kv";
import { storage } from "@src/integrations/storage";
import { db } from "@src/middleware/db";
import { sql } from "drizzle-orm";
import { decode } from "hono/jwt";

const headers = {
    Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
    "Content-Type": "application/json",
};

const SHARED_DATA = {
    EMAIL: "videos@example.com",
    PASSWORD: "password1358",
    DATE: new Date().toISOString(),
};

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
let url: string;
let token: string;
let userId: string;

describe("Videos", () => {
    beforeAll(async () => {
        await kv.flushall();

        const userBody = {
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            firstName: "John",
            lastName: "Doe",
            unitId: process.env.TESTING_UNIT_ID!,
        };

        const userResponse = await fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
            method: "POST",
            headers,
            body: JSON.stringify(userBody),
        });

        expect(userResponse.status).toBe(200);
        token = (await userResponse.json()).data.token;
        const { payload } = decode(token);
        // @ts-ignore
        userId = payload.userId;

    });

    it("return a presigned url", async () => {
        const body = {
            "patientId": userId,
            "filename": "test.txt",
            "date": SHARED_DATA.DATE,
        };

        const response = await fetch(`${BASE_URL}/v1/api/storage/videos/presigned-url`, {
            method: "POST",
            headers: {
                ...headers,
                "X-User": token,
            },
            body: JSON.stringify(body),
        });

        expect(response.status).toBe(200);
        url = (await response.json()).data.url;
    });

    it("should upload a sample file to the presigned url", async () => {
        const response = await fetch(url, {
            method: "PUT"
        });

        expect(response.status).toBe(200);
    });


    afterAll(async () => {
        await Promise.all([
            db.execute(sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`),
            kv.flushall(),
        ]);

        const objectStream = storage.listObjects(userId, "videos/", true);
        const objects = await new Promise((resolve, reject) => {
            const objects: any[] = [];
            objectStream.on("data", (obj) => {
                objects.push(obj);
            });
            objectStream.on("end", () => {
                resolve(objects);
            });
            objectStream.on("error", reject);
        }
        );

        //@ts-ignore
        for await (const obj of objects) {
            await storage.removeObject(userId, obj.name);
        }
        await storage.removeBucket(userId);
    });

});
