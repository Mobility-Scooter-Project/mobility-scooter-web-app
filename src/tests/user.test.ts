import { db } from "@middleware/db";
import { sql } from "drizzle-orm";

const headers = {
  Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
};

const SHARED_DATA = {
    EMAIL: 'john@doe.com',
    PASSWORD: 'password',
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// create-user-emailpass.http
it('should create a new user', async () => {
    const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
        unitId: process.env.TESTING_UNIT_ID!
    }

    const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
         method: 'POST',
         headers,
        body: JSON.stringify(body),
    });

    expect(response.status).toBe(200);
})

// login-user-emailpass.http
it('should login the user', async () => {
    const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
    }

    const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
         body: JSON.stringify(body),
         headers
    });

    expect(response.status).toBe(200);
    
})

afterAll(async () => {
    await db.execute(sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`);
})