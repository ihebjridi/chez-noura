import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  UserDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';

/**
 * AuthService handles authentication logic
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * Validate user credentials and return user data
   * For SUPER_ADMIN and BUSINESS_ADMIN: validate password
   * For EMPLOYEE: email-based authentication (no password required)
   */
  async validateUser(email: string, password?: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        business: true,
        employee: true,
      },
    });

    if (!user) {
      return null;
    }

    // SUPER_ADMIN and BUSINESS_ADMIN require password
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.BUSINESS_ADMIN) {
      if (!password) {
        return null;
      }

      if (!user.password) {
        return null;
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
    }

    // EMPLOYEE uses email-based auth (no password required)
    // Just verify the user exists and is an employee

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      businessId: user.businessId || undefined,
      employeeId: user.employeeId || undefined,
    };
  }

  /**
   * Login user and generate tokens
   */
  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Employee email-based login (no password)
   */
  async loginEmployee(email: string): Promise<LoginResponseDto> {
    const user = await this.validateUser(email);

    if (!user || user.role !== UserRole.EMPLOYEE) {
      throw new UnauthorizedException('Invalid employee email');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponseDto> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken);

      // Generate new access token
      const newPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        businessId: payload.businessId,
        employeeId: payload.employeeId,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
