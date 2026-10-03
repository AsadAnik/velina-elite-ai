import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUserPayload {
  sub: number;
  email: string;
  role: 'customer' | 'admin' | 'owner';
  customerId?: number | null;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
