import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@config/constants';
import { TypedRequest } from '@config/request';
import { JwtDto } from './jwt.dto';

/**
 * JwtMiddleware validates JWT tokens in incoming requests and attaches user information to the request object.
 */
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private config: ConfigService<AppConfig>;
  private jwt: JwtService;
  private readonly logger = new Logger(JwtMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    this.jwt = jwtService;
    this.config = configService;
  }

  /**
   *  Middleware that validates JWT and attaches user info to request
   *
   * @param req - Request
   * @param res - Response
   * @param next - Next function
   * @returns void
   */
  async use(req: TypedRequest, res: any, next: () => void): Promise<void> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    let payload: JwtDto | null;
    try {
      payload = await this.jwt.verify<JwtDto>(token, {
        secret: this.config.get('jwtSecret'),
      });
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error.message}`);
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!payload) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.locals = {
      userId: payload.userId,
      userRole: payload.userRole,
      sessionId: payload.sessionId,
    };

    next();
  }
}
