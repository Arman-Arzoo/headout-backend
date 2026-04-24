import { Role } from '@prisma/client';
import { Request } from 'express';

export interface JwtUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
