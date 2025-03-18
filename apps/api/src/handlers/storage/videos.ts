import { zValidator } from '@hono/zod-validator'
import type { Variables } from '@src/index'
import { dbMiddleware } from '@src/middleware/db'
import { userMiddleware } from '@src/middleware/user'
import { validateApiKey } from '@src/middleware/validate-api-key'
import { storageService } from '@src/services/storage'
import { presignedUrlSchema } from '@src/validators/storage'
import { Hono } from 'hono'

const app = new Hono<{ Variables: Variables }>().post(
  '/presigned-url',
  userMiddleware,
  dbMiddleware,
  validateApiKey,
  zValidator('json', presignedUrlSchema),
  async (c) => {
    const { filename, patientId, date } = c.req.valid('json')
    const userId = c.get('userId')!

    const url = await storageService.generatePresignedVideoPutUrl(
      filename,
      userId,
      patientId,
      date,
    )
    return c.json({
      data: {
        url,
      },
      error: null,
    })
  },
)

export default app
