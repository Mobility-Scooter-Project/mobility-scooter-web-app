import { zValidator } from '@hono/zod-validator'

import type { Variables } from '@src/index'
import { dbMiddleware } from '@src/middleware/db'
import {
  signUpRateLimiter,
  signInRateLimiter,
  resetPasswordRateLimiter,
} from '@src/middleware/rate-limit'
import { validateApiKey } from '@src/middleware/validate-api-key'
import { authService } from '@src/services/auth'
import {
  createUserWithPasswordSchema,
  signInWithPasswordSchema,
  resetPasswordTokenSchema,
  resetPasswordSchema,
  sessionBodySchema,
} from '@src/validators/auth'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'

const app = new Hono<{ Variables: Variables }>()
  .post(
    '/register',
    describeRoute({
      summary: 'Register a new user with email and password',
      description:
        'Register a new user with email and password and return a session',
      tags: ['auth'],
      body: createUserWithPasswordSchema,
      responses: {
        200: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: resolver(sessionBodySchema),
            },
          },
        },
      },
    }),
    validateApiKey,
    dbMiddleware,
    signUpRateLimiter,
    zValidator('json', createUserWithPasswordSchema),
    async (c) => {
      const { email, password, firstName, lastName, unitId } =
        c.req.valid('json')
      const db = c.get('db')

      const { token, refreshToken } = await authService.createUserWithPassword(
        db,
        email,
        password,
        firstName,
        lastName,
        unitId,
      )

      return c.json({
        data: {
          token,
          refreshToken,
        },
        error: null,
      })
    },
  )
  .post(
    '/',
    describeRoute({
      summary: 'Sign in with email and password',
      description: 'Sign in with email and password and return a session',
      tags: ['auth'],
      body: signInWithPasswordSchema,
      responses: {
        200: {
          description: 'User signed in successfully',
          content: {
            'application/json': {
              schema: resolver(sessionBodySchema),
            },
          },
        },
      },
    }),
    validateApiKey,
    dbMiddleware,
    zValidator('json', signInWithPasswordSchema),
    signInRateLimiter,
    async (c) => {
      const { email, password } = c.req.valid('json')
      const db = c.get('db')

      const { token, refreshToken } = await authService.signInWithPassword(
        db,
        email,
        password,
      )

      return c.json({
        data: {
          token,
          refreshToken,
        },
        error: null,
      })
    },
  )
  .post(
    '/reset-password/token',
    describeRoute({
      summary: 'Generate a reset password token',
      description: 'Generate a reset password token for a user',
      tags: ['auth'],
      body: resetPasswordTokenSchema,
      responses: {
        200: {
          description: 'Token generated successfully',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
    }),
    validateApiKey,
    zValidator('json', resetPasswordTokenSchema),
    resetPasswordRateLimiter,
    async (c) => {
      const { email } = c.req.valid('json')

      const token = await authService.generateResetPasswordToken(email)

      // return token in dev and testing environments
      if (token) {
        return c.json({
          data: {
            token,
          },
          error: null,
        })
      }

      return c.text('OK')
    },
  )
  .post(
    '/reset-password',
    describeRoute({
      summary: 'Reset password with token',
      description: 'Reset password with a reset password token',
      tags: ['auth'],
      body: resetPasswordSchema,
      responses: {
        200: {
          description: 'Password reset successfully',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
    }),
    validateApiKey,
    zValidator('json', resetPasswordSchema),
    resetPasswordRateLimiter,
    async (c) => {
      const { token, password } = c.req.valid('json')

      await authService.resetPassword(token, password)

      // optional: create a session instead
      return c.text('OK')
    },
  )

export default app
