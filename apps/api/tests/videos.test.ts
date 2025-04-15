import { HTTP_CODES } from "@src/config/http-codes";
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
  EMAIL: "video@example.com",
  PASSWORD: "password13580",
  DATE: new Date().toISOString(),
  PATIENTID: "abc-123-456",
  FILENAME: "test.txt",
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

    const userResponse = await fetch(
      `${BASE_URL}/api/v1/auth/emailpass/register`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(userBody),
      },
    );

    expect(userResponse.status).toBe(HTTP_CODES.OK);
    token = (await userResponse.json()).data.token;
    const { payload } = decode(token);
    // @ts-expect-error cannot be typed
    userId = payload.userId;
  });

  it("return a presigned url", async () => {
    const body = {
      patientId: SHARED_DATA.PATIENTID,
      filename: SHARED_DATA.FILENAME,
      date: SHARED_DATA.DATE,
    };

    const response = await fetch(
      `${BASE_URL}/api/v1/storage/videos/presigned-url`,
      {
        method: "POST",
        headers: {
          ...headers,
          "X-User": token,
        },
        body: JSON.stringify(body),
      },
    );

    expect(response.status).toBe(HTTP_CODES.OK);
    url = (await response.json()).data.url;
  });

  it("should upload a sample file to the presigned url", async () => {
    const response = await fetch(url, {
      method: "PUT",
    });

    expect(response.status).toBe(HTTP_CODES.OK);
  });

  it("should send the sample file to the queue using a presigned get url", async () => {
    const body = {
      patientId: SHARED_DATA.PATIENTID,
      filename: SHARED_DATA.FILENAME,
      date: SHARED_DATA.DATE,
    };

    const response = await fetch(
      `${BASE_URL}/api/v1/storage/videos/send-to-queue`,
      {
        method: "POST",
        headers: {
          ...headers,
          "X-User": token,
        },
        body: JSON.stringify(body),
      },
    );
    expect(response.status).toBe(HTTP_CODES.OK);
  })

  it("should return 404 when the filename, patientID, or date does not exist in the object storage", async () => {
    const body = {
      patientId: SHARED_DATA.PATIENTID,
      filename: "test1.txt",
      date: SHARED_DATA.DATE,
    };

    const response = await fetch(
      `${BASE_URL}/api/v1/storage/videos/send-to-queue`,
      {
        method: "POST",
        headers: {
          ...headers,
          "X-User": token,
        },
        body: JSON.stringify(body),
      },
    );
    expect(response.status).toBe(HTTP_CODES.NOT_FOUND);
  })

  afterAll(async () => {
    await Promise.all([
      db.execute(
        sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`,
      ),
      kv.flushall(),
    ]);

    const objectStream = storage.listObjects(userId, "videos/", true);
    const objects = await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = [];
      objectStream.on("data", (obj) => {
        objects.push(obj);
      });
      objectStream.on("end", () => {
        resolve(objects);
      });
      objectStream.on("error", reject);
    });

    //@ts-expect-error cannot be typed
    for await (const obj of objects) {
      await storage.removeObject(userId, obj.name);
    }
    await storage.removeBucket(userId);
  });
});
