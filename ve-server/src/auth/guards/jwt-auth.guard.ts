import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;

        if (
            !authorization ||
            typeof authorization !== 'string' ||
            !authorization.startsWith('Bearer ')
        ) {
            throw new UnauthorizedException('Missing bearer token');
        }

        const token = authorization.replace('Bearer ', '').trim();

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'velina-elite-dev-secret',
            });

            // Ensure customerId is properly set
            if (!payload.customerId && payload.sub) {
                // Fallback: try to get customerId from database if not in token
                // For now, we'll set it to null and let the service handle it
                payload.customerId = null;
            }

            request.user = payload;
            return true;
        } catch (error) {
            console.error('JWT verification error:', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
