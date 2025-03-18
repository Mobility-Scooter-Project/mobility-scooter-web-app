import { zValidator } from '@hono/zod-validator'
import type { Variables } from '@src/index'
import { dbMiddleware, db } from '@src/middleware/db'
import { validateApiKey } from '@src/middleware/validate-api-key'
import { authService } from '@src/services/auth'
import { refreshTokenSchema } from '@src/validators/auth'
import { Hono } from 'hono'

const app = new Hono<{ Variables: Variables }>().post(
  '/',
  dbMiddleware,
  validateApiKey,
  zValidator('json', refreshTokenSchema),
  async (c) => {
    const { token } = c.req.valid('json')

    const { token: newToken, refreshToken } = await authService.refreshToken(
      db,
      token,
    )

    return c.json({
      data: {
        token: newToken,
        refreshToken,
      },
      error: null,
    })
  },
)

export default app
