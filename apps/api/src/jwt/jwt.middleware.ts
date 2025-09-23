import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const authHeader = req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    next();
  }
}
