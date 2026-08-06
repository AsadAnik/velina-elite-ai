import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) { }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { customer: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== Role.customer) {
      throw new UnauthorizedException('Only customers can login from this route');
    }

    return this.buildAuthResponse(user);
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { customer: true },
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

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password must match');
    }

    const normalizedEmail = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const username = `${dto.fullName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const user = await this.prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.customer,
        customer: {
          create: {
            fname: dto.fullName.trim().split(/\s+/)[0] ?? dto.fullName.trim(),
            lname: dto.fullName.trim().split(/\s+/).slice(1).join(' ') || dto.fullName.trim(),
            phone: dto.phone ?? null,
            gender: dto.gender ?? 'other',
          },
        },
      },
      include: { customer: true },
    });

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

  private buildAuthResponse(user: { id: number; email: string; role: Role; customer?: { id: number } | null }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
