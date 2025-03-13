import { db } from "@middleware/db";
import { kv } from "@src/integrations/kv";
import { sql } from "drizzle-orm";

const headers = {
  Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
  "Content-Type": "application/json",
};

const SHARED_DATA = {
  EMAIL: "john@doe.com",
  PASSWORD: "password12345",
};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let refreshToken: string;

// create-user-emailpass.http
it("should create a new user", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
    firstName: "John",
    lastName: "Doe",
    unitId: process.env.TESTING_UNIT_ID!,
  };

  const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  expect(response.status).toBe(200);
});

it("should return 409 when an existing email is used", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
    firstName: "John",
    lastName: "Doe",
    unitId: process.env.TESTING_UNIT_ID!,
  };
  const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  expect(response.status).toBe(409);
});

it("should return 429 when the rate limit is exceeded", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
    firstName: "John",
    lastName: "Doe",
    unitId: process.env.TESTING_UNIT_ID!,
  };

  const statuses = await Promise.all(
    Array.from({ length: 50 }).map(() =>
      fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then((r) => r.status)
    )
  );

  expect(statuses.includes(429)).toBe(true);
  expect(statuses.includes(409)).toBe(true);
});

// login-user-emailpass.http
it("should login the user", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
  };

  const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

  expect(response.status).toBe(200);
  refreshToken = (await response.json()).data.refreshToken;
});

it("should return 401 when the password is incorrect", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: "wrongpassword",
  };

  const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

  expect(response.status).toBe(401);
});

it("should return 401 when the email is incorrect", async () => {
  const body = {
    email: "wrong@example.com",
    password: SHARED_DATA.PASSWORD,
  };

  const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

  expect(response.status).toBe(401);
});

it("should return 429 when the rate limit is exceeded", async () => {
  const body = {
    email: SHARED_DATA.EMAIL,
    password: SHARED_DATA.PASSWORD,
  };

  const statuses = await Promise.all(
    Array.from({ length: 6 }).map(() =>
      fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      }).then((r) => r.status)
    )
  );

  // rate limit is 5; 2 requests are allowed, 4 are blocked
  expect(statuses.includes(429)).toBe(true);
});

it("should refresh the token and session", async () => {
  const body = {
    token: refreshToken,
  };

  const response = await fetch(`${BASE_URL}/v1/api/auth/refresh`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  expect(response.status).toBe(200);
});

afterAll(async () => {
  await db.execute(
    sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`
  );
  await kv.flushall();
});
