import { USER_ROLES } from '@config/enums';

export interface JwtDto {
  userId: string;
  userRole: USER_ROLES;
  sessionId: string;
  iat: number;
  exp: number;
}
