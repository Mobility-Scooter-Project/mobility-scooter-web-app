import { db } from '@middleware/db'
import { kv } from '@src/integrations/kv'
import { sql } from 'drizzle-orm'

const headers = {
  Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
  'Content-Type': 'application/json',
}

const SHARED_DATA = {
  EMAIL: 'users@example.com',
  PASSWORD: 'password1358',
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

describe('User', () => {
  beforeEach(async () => {
    await kv.flushall()
  })

  describe('Create', () => {
    // create-user-emailpass.http
    it('should create a new user', async () => {
      const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
        unitId: process.env.TESTING_UNIT_ID!,
      }

      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/register`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
      )

      expect(response.status).toBe(200)
    })

    it('should return 409 when an existing email is used', async () => {
      const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
        unitId: process.env.TESTING_UNIT_ID!,
      }
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/register`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
      )

      expect(response.status).toBe(409)
    })

    it('should return 409 when the rate limit is exceeded', async () => {
      const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
        unitId: process.env.TESTING_UNIT_ID!,
      }

      const statuses = await Promise.all(
        Array.from({ length: 51 }).map(() =>
          fetch(`${BASE_URL}/v1/api/auth/emailpass/register`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          }).then((r) => r.status),
        ),
      )

      expect(statuses.includes(409)).toBe(true)
    })

    it('should return 400 when the email is invalid', async () => {
      const body = {
        email: 'invalidemail',
        password: SHARED_DATA.PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
        unitId: process.env.TESTING_UNIT_ID!,
      }

      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/register`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
      )

      expect(response.status).toBe(400)
    })

    describe('Password', () => {
      it('should return 400 when password is too short', async () => {
        const body = {
          email: 'test@example.com',
          password: 'abc123',
          firstName: 'John',
          lastName: 'Doe',
          unitId: process.env.TESTING_UNIT_ID!,
        }

        const response = await fetch(
          `${BASE_URL}/v1/api/auth/emailpass/register`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          },
        )

        expect(response.status).toBe(400)
      })

      it('should return 400 when password is too long', async () => {
        const body = {
          email: 'test1@example.com',
          password: 'a'.repeat(65),
          firstName: 'John',
          lastName: 'Doe',
          unitId: process.env.TESTING_UNIT_ID!,
        }

        const response = await fetch(
          `${BASE_URL}/v1/api/auth/emailpass/register`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          },
        )

        expect(response.status).toBe(400)
      })

      it('should return 400 when password contains sequential characters', async () => {
        const body = {
          email: 'test2@example.com',
          password: 'abcd1234',
          firstName: 'John',
          lastName: 'Doe',
          unitId: process.env.TESTING_UNIT_ID!,
        }

        const response = await fetch(
          `${BASE_URL}/v1/api/auth/emailpass/register`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          },
        )

        expect(response.status).toBe(400)
      })

      it('should return 400 when password contains repeated characters', async () => {
        const body = {
          email: 'test5@example.com',
          password: 'aaaaaaaa',
          firstName: 'John',
          lastName: 'Doe',
          unitId: process.env.TESTING_UNIT_ID!,
        }

        const response = await fetch(
          `${BASE_URL}/v1/api/auth/emailpass/register`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          },
        )

        expect(response.status).toBe(400)
      })

      it('should return 400 when password is a common dictionary word', async () => {
        const body = {
          email: 'test4@example.com',
          password: 'cheeseburger',
          firstName: 'John',
          lastName: 'Doe',
          unitId: process.env.TESTING_UNIT_ID!,
        }

        const response = await fetch(
          `${BASE_URL}/v1/api/auth/emailpass/register`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          },
        )

        expect(response.status).toBe(400)
      })
    })
  })

  describe('Login', () => {
    // login-user-emailpass.http
    it('should login the user', async () => {
      const body = {
        email: SHARED_DATA.EMAIL,
        password: SHARED_DATA.PASSWORD,
      }

      const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      })

      expect(response.status).toBe(200)
      refreshToken = (await response.json()).data.refreshToken
    })

    it('should return 401 when the password is incorrect', async () => {
      const body = {
        email: SHARED_DATA.EMAIL,
        password: 'wrongpassword',
      }

      const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      })

      expect(response.status).toBe(401)
    })

    it('should return 401 when the email is incorrect', async () => {
      const body = {
        email: 'wrong@example.com',
        password: SHARED_DATA.PASSWORD,
      }

      const response = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      })

      expect(response.status).toBe(401)
    })

    describe('Refresh Token', () => {
      // refresh-token.http
      it('should refresh the token', async () => {
        const userResponse = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
          method: 'POST',
          body: JSON.stringify({
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
          }),
          headers,
        })

        const token = (await userResponse.json()).data.refreshToken

        const body = {
          token,
        }

        const response = await fetch(`${BASE_URL}/v1/api/auth/refresh`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers,
        })

        expect(response.status).toBe(200)
      })

      it('should return 401 when the token is invalid', async () => {
        const body = {
          token: 'invalidtoken',
        }

        const response = await fetch(`${BASE_URL}/v1/api/auth/refresh`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers,
        })

        expect(response.status).toBe(401)
      })
    })
  })

  describe('Reset Password', () => {
    let resetToken: string

    beforeEach(async () => {
      await kv.flushall()
    })

    it('should send a reset password email', async () => {
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/reset-password/token`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: SHARED_DATA.EMAIL,
          }),
          headers,
        },
      )

      expect(response.status).toBe(200)
      resetToken = (await response.json()).data.token
    })

    it('should return 404 when the email is incorrect', async () => {
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/reset-password/token`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'wrong@example.com',
          }),
          headers,
        },
      )

      expect(response.status).toBe(404)
    })

    it('should reset the password', async () => {
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            token: resetToken,
          }),
          headers,
        },
      )

      expect(response.status).toBe(200)
    })

    it('should return 401 when the token is invalid', async () => {
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: SHARED_DATA.EMAIL,
            password: SHARED_DATA.PASSWORD,
            token: 'invalidtoken',
          }),
          headers,
        },
      )

      expect(response.status).toBe(401)
    })

    it('should return 400 when the password is invalid', async () => {
      const response = await fetch(
        `${BASE_URL}/v1/api/auth/emailpass/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: SHARED_DATA.EMAIL,
            password: 'abc123',
            token: resetToken,
          }),
          headers,
        },
      )

      expect(response.status).toBe(400)
    })

    it('should return 429 when the rate limit is exceeded', async () => {
      const statuses = await Promise.all(
        Array.from({ length: 4 }).map(() =>
          fetch(`${BASE_URL}/v1/api/auth/emailpass/reset-password`, {
            method: 'POST',
            body: JSON.stringify({
              email: SHARED_DATA.EMAIL,
              password: SHARED_DATA.PASSWORD,
              token: resetToken,
            }),
            headers,
          }).then((r) => r.status),
        ),
      )

      expect(statuses.includes(429)).toBe(true)
    })
  })

  describe('OTP', () => {
    beforeEach(async () => {
      await kv.flushall()
    })
    it('should generate an OTP secret', async () => {
      const loginResponse = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
        body: JSON.stringify({
          email: SHARED_DATA.EMAIL,
          password: SHARED_DATA.PASSWORD,
        }),
        headers,
      })

      const { token } = (await loginResponse.json()).data

      const response = await fetch(`${BASE_URL}/v1/api/auth/otp`, {
        method: 'GET',
        headers: {
          ...headers,
          'X-User': token,
        },
      })

      expect(response.status).toBe(200)
    })

    it('should return 429 when rate limit is exceeded', async () => {
      const loginResponse = await fetch(`${BASE_URL}/v1/api/auth/emailpass`, {
        method: 'POST',
        body: JSON.stringify({
          email: SHARED_DATA.EMAIL,
          password: SHARED_DATA.PASSWORD,
        }),
        headers,
      })

      const { token } = (await loginResponse.json()).data

      const statuses = await Promise.all(
        Array.from({ length: 50 }).map(() =>
          fetch(`${BASE_URL}/v1/api/auth/otp/verify`, {
            method: 'POST',
            headers: {
              ...headers,
              'X-User': token,
            },
            body: JSON.stringify({
              token: '123456',
              secret: 'secret',
            }),
          }).then((r) => r.status),
        ),
      )

      expect(statuses.includes(429)).toBe(true)
    })
  })

  afterAll(async () => {
    await Promise.all([
      db.execute(
        sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`,
      ),
      kv.flushall(),
    ])
  })
})
