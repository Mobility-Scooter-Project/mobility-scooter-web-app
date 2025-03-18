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
} from '@src/validators/auth'
import { Hono } from 'hono'

const app = new Hono<{ Variables: Variables }>()
  .post(
    '/register',
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
