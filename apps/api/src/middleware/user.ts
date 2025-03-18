import { JWT_SECRET } from '@config/constants'
import { HTTP_CODES } from '@src/config/http-codes'
import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'

/**
 * Middleware function for user authentication.
 * Verifies the user JWT token and sets userId and sessionId in the context.
 *
 * @param c - The Hono context object
 * @param next - The next middleware function to be called
 * @throws {HTTPException} 400 - If no user data is provided in the request
 * @throws {HTTPException} 401 - If user authentication fails
 */
export const userMiddleware = async (c: Context, next: Next) => {
  const user = c.req.header('X-User')

  if (!user) {
    throw new HTTPException(400, {
      message: 'Unauthorized',
    })
  }
  try {
    const { userId, sessionId } = await verify(user, JWT_SECRET)

    if (!userId || !sessionId) {
      throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
        message: 'Failed to authenticate user',
      })
    }

    c.set('userId', userId)
    c.set('sessionId', sessionId)

    await next()
  } catch (e) {
    console.error(e)
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      message: 'Unauthorized',
    })
  }
}
