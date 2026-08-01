import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      const createdUser = await this.ensureDefaultAdminUser(dto);
      return this.buildAuthResponse(createdUser);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== Role.admin && user.role !== Role.owner) {
      throw new UnauthorizedException(
        'Only admin or owner role can access the admin panel',
      );
    }

    return this.buildAuthResponse(user);
  }

  private async ensureDefaultAdminUser(dto: LoginDto) {
    const defaultAdminEmail = 'velinaelitebd01@gmail.com';
    const defaultPassword = 'Velina.Admin1234';

    if (
      dto.email.toLowerCase() !== defaultAdminEmail ||
      dto.password !== defaultPassword
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: defaultAdminEmail },
    });

    if (existingUser) {
      return existingUser;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    return this.prisma.user.create({
      data: {
        username: 'velina-admin',
        email: defaultAdminEmail,
        password: passwordHash,
        role: Role.owner,
      },
    });
  }

  private buildAuthResponse(user: { id: number; email: string; role: Role }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
