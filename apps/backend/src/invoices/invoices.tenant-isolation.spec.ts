/**
 * Integration tests for tenant isolation in invoices endpoints
 * 
 * These tests verify that BUSINESS_ADMIN users cannot access invoices
 * from other businesses, ensuring proper tenant isolation.
 * 
 * Note: These are unit tests that verify the service layer logic.
 * For full integration tests with database, see e2e test suite.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TokenPayload } from '@contracts/core';

describe('InvoicesService - Tenant Isolation', () => {
  let service: InvoicesService;
  let prisma: PrismaService;

  const mockBusiness1Admin: TokenPayload = {
    userId: 'user1',
    role: UserRole.BUSINESS_ADMIN,
    businessId: 'business1',
  };

  const mockBusiness2Admin: TokenPayload = {
    userId: 'user2',
    role: UserRole.BUSINESS_ADMIN,
    businessId: 'business2',
  };

  const mockSuperAdmin: TokenPayload = {
    userId: 'admin1',
    role: UserRole.SUPER_ADMIN,
  };

  const mockInvoice1 = {
    id: 'invoice1',
    businessId: 'business1',
    invoiceNumber: 'INV-001',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    status: 'DRAFT',
    subtotal: 1000,
    tax: null,
    total: 1000,
    dueDate: new Date('2024-02-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    business: {
      name: 'Business 1',
      email: 'business1@example.com',
    },
    items: [],
  };

  const mockInvoice2 = {
    id: 'invoice2',
    businessId: 'business2',
    invoiceNumber: 'INV-002',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    status: 'DRAFT',
    subtotal: 2000,
    tax: null,
    total: 2000,
    dueDate: new Date('2024-02-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    business: {
      name: 'Business 2',
      email: 'business2@example.com',
    },
    items: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getInvoiceById', () => {
    it('should allow BUSINESS_ADMIN to access their own business invoice', async () => {
      jest.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(mockInvoice1 as any);

      const result = await service.getInvoiceById('invoice1', mockBusiness1Admin);

      expect(result).toBeDefined();
      expect(result.id).toBe('invoice1');
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice1' },
        include: {
          business: {
            select: {
              name: true,
              email: true,
            },
          },
          items: true,
        },
      });
    });

    it('should deny BUSINESS_ADMIN access to other business invoice', async () => {
      jest.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(mockInvoice2 as any);

      await expect(service.getInvoiceById('invoice2', mockBusiness1Admin)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getInvoiceById('invoice2', mockBusiness1Admin)).rejects.toThrow(
        'You can only view invoices for your own business',
      );
    });

    it('should allow SUPER_ADMIN to access any invoice', async () => {
      jest.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(mockInvoice2 as any);

      const result = await service.getInvoiceById('invoice2', mockSuperAdmin);

      expect(result).toBeDefined();
      expect(result.id).toBe('invoice2');
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      jest.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(null);

      await expect(service.getInvoiceById('nonexistent', mockBusiness1Admin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should deny access if BUSINESS_ADMIN has no businessId', async () => {
      const userWithoutBusiness: TokenPayload = {
        userId: 'user1',
        role: UserRole.BUSINESS_ADMIN,
        businessId: undefined,
      };

      jest.spyOn(prisma.invoice, 'findUnique').mockResolvedValue(mockInvoice1 as any);

      await expect(service.getInvoiceById('invoice1', userWithoutBusiness)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getBusinessInvoices', () => {
    it('should return only invoices for the BUSINESS_ADMIN business', async () => {
      const mockInvoices = [mockInvoice1];
      jest.spyOn(prisma.invoice, 'findMany').mockResolvedValue(mockInvoices as any);

      const result = await service.getBusinessInvoices(mockBusiness1Admin);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('invoice1');
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'business1',
        },
        include: {
          business: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should deny access if user is not BUSINESS_ADMIN', async () => {
      const employee: TokenPayload = {
        userId: 'emp1',
        role: UserRole.EMPLOYEE,
        businessId: 'business1',
        employeeId: 'emp1',
      };

      await expect(service.getBusinessInvoices(employee)).rejects.toThrow(ForbiddenException);
      await expect(service.getBusinessInvoices(employee)).rejects.toThrow(
        'Only BUSINESS_ADMIN can view business invoices',
      );
    });

    it('should deny access if BUSINESS_ADMIN has no businessId', async () => {
      const userWithoutBusiness: TokenPayload = {
        userId: 'user1',
        role: UserRole.BUSINESS_ADMIN,
        businessId: undefined,
      };

      await expect(service.getBusinessInvoices(userWithoutBusiness)).rejects.toThrow(
        'User must be associated with a business',
      );
    });
  });
});
