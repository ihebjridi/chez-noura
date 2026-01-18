import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto, TokenPayload } from '@contracts/core';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current user profile
   */
  async getCurrentUser(payload: TokenPayload): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        business: true,
        employee: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      businessId: user.businessId || undefined,
      employeeId: user.employeeId || undefined,
    };
  }
}
