import type { Variables } from 'src'
import emailpass from './emailpass'
import otp from './otp'
import refresh from './refresh'

const app = new Hono<{ Variables: Variables }>()
  .route('/emailpass', emailpass)
  .route('/refresh', refresh)
  .route('/otp', otp)

export default app
