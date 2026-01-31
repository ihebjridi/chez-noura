import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
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
  EntityStatus,
} from '@contracts/core';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

/**
 * AuthService handles authentication logic
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ActivityLogsService))
    private activityLogsService?: ActivityLogsService,
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

    // For BUSINESS_ADMIN, check if business is active
    if (user.role === UserRole.BUSINESS_ADMIN) {
      if (!user.business) {
        console.error(`Business admin user ${email} has no associated business`);
        return null;
      }

      if (user.business.status !== EntityStatus.ACTIVE) {
        console.error(
          `Business admin user ${email} attempted login but business ${user.business.id} is ${user.business.status}`,
        );
        return null;
      }
    }

    // SUPER_ADMIN and BUSINESS_ADMIN require password
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.BUSINESS_ADMIN) {
      if (!password) {
        return null;
      }

      // BUSINESS_ADMIN: accept main password or temporary (investigation) password
      if (user.role === UserRole.BUSINESS_ADMIN) {
        const mainValid =
          user.password && (await this.comparePassword(password, user.password));
        const tempValid =
          user.temporaryPasswordHash &&
          (await this.comparePassword(password, user.temporaryPasswordHash)) &&
          (!user.temporaryPasswordExpiresAt ||
            user.temporaryPasswordExpiresAt > new Date());
        if (!mainValid && !tempValid) {
          console.error(`Password validation failed for user ${email}`);
          return null;
        }
      } else {
        // SUPER_ADMIN: only main password
        if (!user.password) {
          console.error(`User ${email} (${user.role}) has no password set`);
          return null;
        }
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
          console.error(`Password validation failed for user ${email}`);
          return null;
        }
      }
    }

    // EMPLOYEE uses email-based auth (no password required)
    // Just verify the user exists and is an employee
    // For employees, ensure businessId is set from Employee when User.businessId is missing (legacy/migration)
    const resolvedBusinessId = user.businessId ?? user.employee?.businessId ?? undefined;

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      businessId: resolvedBusinessId,
      employeeId: user.employeeId || undefined,
    };
  }

  /**
   * Login user and generate tokens
   */
  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    // Trim email and password to handle any accidental whitespace
    const trimmedEmail = loginDto.email.trim();
    const trimmedPassword = loginDto.password.trim();
    const user = await this.validateUser(trimmedEmail, trimmedPassword);

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

    // Log login activity for BUSINESS_ADMIN users
    if (user.role === UserRole.BUSINESS_ADMIN && this.activityLogsService) {
      try {
        await this.activityLogsService.create({
          userId: user.id,
          businessId: user.businessId,
          action: 'LOGIN',
          details: JSON.stringify({ email: user.email }),
        });
      } catch (error) {
        // Don't fail login if logging fails
        console.error('Failed to log login activity:', error);
      }
    }

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
    // Trim email to handle any accidental whitespace
    const trimmedEmail = email.trim();
    const user = await this.validateUser(trimmedEmail);

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
