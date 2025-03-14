import { kv } from "@src/integrations/kv";
import { db } from "@src/middleware/db";
import { sql } from "drizzle-orm";

const headers = {
    Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
    "Content-Type": "application/json",
};

const SHARED_DATA = {
    EMAIL: "john@doe.com",
    PASSWORD: "password12345",
};

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
let url = "";

describe("Videos", () => {

    it("create a new user and return a presigned url", async () => {
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

        const token = (await userResponse.json()).data.token;

        const body = {
            "patientId": "abc-123-456-789",
            "filename": "test.txt",
            "date": new Date().toISOString()
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
        await db.execute(
            sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`
        );
        await kv.flushall();
    });

});
