import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvoiceDto,
  InvoiceSummaryDto,
  TokenPayload,
  UserRole,
  InvoiceStatus,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate invoice number in format: INV-YYYYMMDD-XXXX
   */
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Generate invoices for a period
   * Idempotent: won't create duplicate invoices for the same business/period
   * Only includes LOCKED orders
   */
  async generateInvoices(
    periodStart: string,
    periodEnd: string,
    user: TokenPayload,
  ): Promise<InvoiceDto[]> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can generate invoices');
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (startDate > endDate) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    // Normalize dates to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Find all LOCKED orders in the period
    const allOrders = await this.prisma.order.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'LOCKED',
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pack: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: [
        { businessId: 'asc' },
        { orderDate: 'asc' },
      ],
    });

    // Find orders that are already in non-DRAFT invoices
    const invoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        orderId: {
          in: allOrders.map((o) => o.id),
        },
        invoice: {
          status: {
            not: 'DRAFT', // Exclude orders in DRAFT invoices (can be regenerated)
          },
        },
      },
      select: {
        orderId: true,
      },
    });

    const excludedOrderIds = new Set(invoiceItems.map((item) => item.orderId));

    // Group orders by business (including already invoiced ones for idempotency check)
    const ordersByBusiness = new Map<string, typeof allOrders>();
    for (const order of allOrders) {
      const businessId = order.businessId;
      if (!ordersByBusiness.has(businessId)) {
        ordersByBusiness.set(businessId, []);
      }
      ordersByBusiness.get(businessId)!.push(order);
    }

    // Generate invoices for each business
    const invoices: InvoiceDto[] = [];

    for (const [businessId, businessOrders] of ordersByBusiness.entries()) {
      // Check if invoice already exists for this business/period (idempotency)
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          businessId,
          periodStart: startDate,
          periodEnd: endDate,
          status: {
            in: ['DRAFT', 'ISSUED'], // Don't regenerate if already issued
          },
        },
      });

      if (existingInvoice) {
        // Return existing invoice (idempotent behavior)
        const invoice = await this.getInvoiceById(existingInvoice.id, user);
        invoices.push(invoice);
        continue;
      }

      // Filter to only orders that aren't already invoiced
      const availableOrders = businessOrders.filter(
        (order) => !excludedOrderIds.has(order.id),
      );

      if (availableOrders.length === 0) {
        // All orders for this business are already invoiced, skip
        continue;
      }

      // Calculate totals (pack-based: one pack per order)
      let subtotal = 0;
      const invoiceItems: Array<{
        orderId: string;
        orderDate: Date;
        packName: string;
        quantity: number; // Always 1 (one pack per order)
        unitPrice: number; // Pack price
        totalPrice: number; // Pack price × quantity
      }> = [];

      for (const order of availableOrders) {
        const packPrice = Number(order.pack.price);
        const quantity = 1; // One pack per order
        const totalPrice = packPrice * quantity;
        subtotal += totalPrice;

        invoiceItems.push({
          orderId: order.id,
          orderDate: order.orderDate,
          packName: order.pack.name,
          quantity,
          unitPrice: packPrice,
          totalPrice,
        });
      }

      if (invoiceItems.length === 0) {
        continue; // Skip businesses with no items
      }

      // Calculate due date (30 days from period end)
      const dueDate = new Date(endDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Generate invoice number
      let invoiceNumber = this.generateInvoiceNumber();
      let attempts = 0;
      while (
        await this.prisma.invoice.findUnique({
          where: { invoiceNumber },
        })
      ) {
        invoiceNumber = this.generateInvoiceNumber();
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique invoice number');
        }
      }

      // Create invoice with items in a transaction
      const invoice = await this.prisma.$transaction(async (tx) => {
        // Check again for race condition
        const existing = await tx.invoice.findFirst({
          where: {
            businessId,
            periodStart: startDate,
            periodEnd: endDate,
            status: {
              in: ['DRAFT', 'ISSUED'],
            },
          },
        });

        if (existing) {
          throw new ConflictException(
            'Invoice already exists for this business and period',
          );
        }

        // Verify no order is already in another invoice (double-check for race conditions)
        const existingItems = await tx.invoiceItem.findMany({
          where: {
            orderId: {
              in: invoiceItems.map((item) => item.orderId),
            },
          },
          select: {
            orderId: true,
          },
        });

        if (existingItems.length > 0) {
          throw new ConflictException(
            `Some orders are already included in other invoices: ${existingItems.map((i) => i.orderId).join(', ')}`,
          );
        }

        // Create invoice
        try {
          const newInvoice = await tx.invoice.create({
            data: {
              businessId,
              invoiceNumber,
              periodStart: startDate,
              periodEnd: endDate,
              status: InvoiceStatus.DRAFT,
              subtotal,
              tax: null, // No tax by default
              total: subtotal, // total = subtotal + tax (tax is null)
              dueDate,
              items: {
                create: invoiceItems,
              },
            },
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

          return newInvoice;
        } catch (error) {
          // Handle unique constraint violation on orderId
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException(
              'One or more orders are already included in another invoice',
            );
          }
          throw error;
        }
      });

      invoices.push(this.mapInvoiceToDto(invoice));
    }

    // If no new invoices were created but we have existing ones, return them
    // This handles the case where all orders were already invoiced
    if (invoices.length === 0 && allOrders.length > 0) {
      // Try to find existing invoices for all businesses in the period
      const businessIds = Array.from(ordersByBusiness.keys());
      const existingInvoices = await this.prisma.invoice.findMany({
        where: {
          businessId: {
            in: businessIds,
          },
          periodStart: startDate,
          periodEnd: endDate,
          status: {
            in: ['DRAFT', 'ISSUED'],
          },
        },
      });

      for (const existingInvoice of existingInvoices) {
        const invoice = await this.getInvoiceById(existingInvoice.id, user);
        invoices.push(invoice);
      }
    }

    if (invoices.length === 0) {
      throw new BadRequestException(
        'No LOCKED orders found for the specified period',
      );
    }

    return invoices;
  }

  /**
   * Get all invoices (admin view)
   */
  async getAdminInvoices(user: TokenPayload): Promise<InvoiceSummaryDto[]> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view all invoices');
    }

    const invoices = await this.prisma.invoice.findMany({
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

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      businessName: invoice.business.name,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      status: invoice.status as any,
      total: Number(invoice.total),
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString(),
    }));
  }

  /**
   * Get invoices for a business
   */
  async getBusinessInvoices(
    user: TokenPayload,
  ): Promise<InvoiceSummaryDto[]> {
    if (user.role !== UserRole.BUSINESS_ADMIN) {
      throw new ForbiddenException('Only BUSINESS_ADMIN can view business invoices');
    }

    if (!user.businessId) {
      throw new BadRequestException('User must be associated with a business');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        businessId: user.businessId,
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

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      businessName: invoice.business.name,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      status: invoice.status as any,
      total: Number(invoice.total),
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString(),
    }));
  }

  /**
   * Get invoice by ID
   * SUPER_ADMIN can view any invoice
   * BUSINESS_ADMIN can only view their business's invoices
   */
  async getInvoiceById(
    id: string,
    user: TokenPayload,
  ): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
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

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Check authorization
    if (user.role === UserRole.BUSINESS_ADMIN) {
      if (!user.businessId || user.businessId !== invoice.businessId) {
        throw new ForbiddenException(
          'You can only view invoices for your own business',
        );
      }
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN and BUSINESS_ADMIN can view invoices');
    }

    return this.mapInvoiceToDto(invoice);
  }

  /**
   * Issue an invoice (change status from DRAFT to ISSUED)
   * Once issued, invoice becomes immutable
   */
  async issueInvoice(id: string, user: TokenPayload): Promise<InvoiceDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can issue invoices');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot issue invoice with status ${invoice.status}. Only DRAFT invoices can be issued.`,
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
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

    return this.mapInvoiceToDto(updated);
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, user: TokenPayload): Promise<InvoiceDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can mark invoices as paid');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot mark invoice as paid. Invoice must be ISSUED first.`,
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
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

    return this.mapInvoiceToDto(updated);
  }

  private mapInvoiceToDto(invoice: any): InvoiceDto {
    return {
      id: invoice.id,
      businessId: invoice.businessId,
      businessName: invoice.business.name,
      businessEmail: invoice.business.email,
      invoiceNumber: invoice.invoiceNumber,
      periodStart: invoice.periodStart.toISOString().split('T')[0],
      periodEnd: invoice.periodEnd.toISOString().split('T')[0],
      status: invoice.status as any,
      subtotal: Number(invoice.subtotal),
      tax: invoice.tax ? Number(invoice.tax) : undefined,
      total: Number(invoice.total),
      items: invoice.items.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        orderDate: item.orderDate.toISOString().split('T')[0],
        packName: item.packName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      issuedAt: invoice.issuedAt
        ? invoice.issuedAt.toISOString()
        : undefined,
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : undefined,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}
