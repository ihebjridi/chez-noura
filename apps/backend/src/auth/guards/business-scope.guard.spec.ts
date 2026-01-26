import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessScopeGuard } from './business-scope.guard';
import { UserRole, TokenPayload } from '@contracts/core';
import { BUSINESS_SCOPED_KEY } from '../decorators/business-scoped.decorator';

describe('BusinessScopeGuard', () => {
  let guard: BusinessScopeGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user: TokenPayload | null, params?: any, body?: any, query?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: params || {},
          body: body || {},
          query: query || {},
          method: 'GET',
          url: '/test',
        }),
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessScopeGuard, Reflector],
    }).compile();

    guard = module.get<BusinessScopeGuard>(BusinessScopeGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when endpoint is not business-scoped', () => {
    it('should allow access', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const context = mockExecutionContext({
        userId: 'user1',
        role: UserRole.BUSINESS_ADMIN,
        businessId: 'business1',
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when endpoint is business-scoped', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    });

    it('should deny access if user is not authenticated', () => {
      const context = mockExecutionContext(null);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should allow SUPER_ADMIN access', () => {
      const context = mockExecutionContext({
        userId: 'admin1',
        role: UserRole.SUPER_ADMIN,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if BUSINESS_ADMIN has no businessId', () => {
      const context = mockExecutionContext({
        userId: 'user1',
        role: UserRole.BUSINESS_ADMIN,
        businessId: undefined,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User does not belong to a business');
    });

    it('should deny access if EMPLOYEE has no businessId', () => {
      const context = mockExecutionContext({
        userId: 'user1',
        role: UserRole.EMPLOYEE,
        businessId: undefined,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User does not belong to a business');
    });

    it('should allow access if no businessId in request (service layer enforces)', () => {
      const context = mockExecutionContext({
        userId: 'user1',
        role: UserRole.BUSINESS_ADMIN,
        businessId: 'business1',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if businessId in params matches user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        { businessId: 'business1' },
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if businessId in params does not match user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        { businessId: 'business2' },
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied to this business resource');
    });

    it('should allow access if businessId in body matches user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        {},
        { businessId: 'business1' },
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if businessId in body does not match user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        {},
        { businessId: 'business2' },
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied to this business resource');
    });

    it('should allow access if businessId in query matches user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        {},
        {},
        { businessId: 'business1' },
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if businessId in query does not match user businessId', () => {
      const context = mockExecutionContext(
        {
          userId: 'user1',
          role: UserRole.BUSINESS_ADMIN,
          businessId: 'business1',
        },
        {},
        {},
        { businessId: 'business2' },
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied to this business resource');
    });
  });
});
