import { type Request } from 'express';
import { USER_ROLES } from './enums';

interface Locals {
  userId?: string;
  sessionId?: string;
  userRole?: USER_ROLES;
}

export interface TypedRequest extends Request {
  locals: Locals;
}
