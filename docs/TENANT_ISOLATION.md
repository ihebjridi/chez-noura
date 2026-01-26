# Tenant Isolation Guidelines

This document outlines the patterns and guidelines for ensuring proper tenant isolation in the Chez Noura application.

## Overview

Chez Noura is a multi-tenant SaaS application where each business (tenant) must be completely isolated from others. This is a **critical security requirement** that must be enforced at multiple layers.

## Security Priority

Following the overriding rule: **Security > clarity > speed > features**

Tenant isolation is a security concern and takes absolute priority over all other considerations.

## Architecture

### Tenant Model

- Each `Business` is a tenant
- Users belong to a business via `businessId` field
- Employees belong to a business via `businessId` field
- Orders, Invoices, and other entities are scoped to a business

### User Roles

- **SUPER_ADMIN**: Can access all businesses (global access)
- **BUSINESS_ADMIN**: Can only access their own business
- **EMPLOYEE**: Can only access their own orders and business context

## Enforcement Layers

### 1. Guard Layer (`BusinessScopeGuard`)

The `BusinessScopeGuard` is the first line of defense for tenant isolation.

**When to use `@BusinessScoped` decorator:**

- Endpoints that access business-specific resources
- Endpoints where `businessId` might be in the request (params, body, or query)
- Endpoints that should be restricted to a user's business

**How it works:**

1. Checks if endpoint is marked with `@BusinessScoped`
2. If not marked, allows access (relies on service layer)
3. If marked:
   - SUPER_ADMIN: Always allowed
   - BUSINESS_ADMIN/EMPLOYEE: Must have `businessId` in token
   - If `businessId` in request, validates it matches user's `businessId`
   - If no `businessId` in request, allows (service layer enforces)

**Example:**

```typescript
@Get('business/employees')
@Roles(UserRole.BUSINESS_ADMIN)
@BusinessScoped()  // Enforces tenant isolation
async listEmployees(@CurrentUser() user: TokenPayload) {
  return this.employeeService.listEmployees(user);
}
```

### 2. Service Layer

**Always filter by `businessId` in database queries** when accessing tenant data.

**Patterns:**

1. **Direct filtering** (preferred):
```typescript
async getBusinessInvoices(user: TokenPayload): Promise<InvoiceDto[]> {
  if (!user.businessId) {
    throw new BadRequestException('User must be associated with a business');
  }
  
  const invoices = await this.prisma.invoice.findMany({
    where: {
      businessId: user.businessId,  // Explicit filtering
    },
  });
  return invoices;
}
```

2. **Post-fetch validation** (for single resource lookups):
```typescript
async getInvoiceById(id: string, user: TokenPayload): Promise<InvoiceDto> {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id },
  });
  
  if (!invoice) {
    throw new NotFoundException('Invoice not found');
  }
  
  // Validate ownership
  if (user.role === UserRole.BUSINESS_ADMIN) {
    if (!user.businessId || user.businessId !== invoice.businessId) {
      throw new ForbiddenException('Access denied');
    }
  }
  
  return invoice;
}
```

3. **Employee-scoped queries** (filter by `employeeId`):
```typescript
async getMyOrders(user: TokenPayload): Promise<OrderDto[]> {
  if (!user.employeeId) {
    throw new BadRequestException('Employee ID not found');
  }
  
  const orders = await this.prisma.order.findMany({
    where: {
      employeeId: user.employeeId,  // Employee isolation
    },
  });
  return orders;
}
```

### 3. Controller Layer

**Best practices:**

1. **Always use guards:**
```typescript
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessController {
  // ...
}
```

2. **Mark business-scoped endpoints:**
```typescript
@Get('employees')
@Roles(UserRole.BUSINESS_ADMIN)
@BusinessScoped()  // Explicit tenant isolation
async listEmployees() {
  // ...
}
```

3. **Use `@CurrentUser()` decorator** to get authenticated user:
```typescript
async getResource(@CurrentUser() user: TokenPayload) {
  // user.businessId is guaranteed to be set for BUSINESS_ADMIN/EMPLOYEE
  // (enforced by BusinessScopeGuard)
}
```

## Common Patterns

### Pattern 1: List Resources for Business

```typescript
// Controller
@Get('business/employees')
@Roles(UserRole.BUSINESS_ADMIN)
@BusinessScoped()
async listEmployees(@CurrentUser() user: TokenPayload) {
  return this.service.listEmployees(user);
}

// Service
async listEmployees(user: TokenPayload): Promise<EmployeeDto[]> {
  if (!user.businessId) {
    throw new ForbiddenException('User does not belong to a business');
  }
  
  return this.prisma.employee.findMany({
    where: { businessId: user.businessId },
  });
}
```

### Pattern 2: Get Single Resource with Ownership Check

```typescript
// Controller
@Get(':id')
@Roles(UserRole.BUSINESS_ADMIN)
@BusinessScoped()
async getInvoice(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
  return this.service.getInvoiceById(id, user);
}

// Service
async getInvoiceById(id: string, user: TokenPayload): Promise<InvoiceDto> {
  const invoice = await this.prisma.invoice.findUnique({ where: { id } });
  
  if (!invoice) {
    throw new NotFoundException('Invoice not found');
  }
  
  // Validate ownership for BUSINESS_ADMIN
  if (user.role === UserRole.BUSINESS_ADMIN) {
    if (!user.businessId || user.businessId !== invoice.businessId) {
      throw new ForbiddenException('Access denied');
    }
  }
  
  return invoice;
}
```

### Pattern 3: Create Resource (Auto-assign businessId)

```typescript
// Service
async createOrder(dto: CreateOrderDto, user: TokenPayload): Promise<OrderDto> {
  if (!user.businessId || !user.employeeId) {
    throw new BadRequestException('User must be associated with a business');
  }
  
  // Automatically assign businessId from user context
  const order = await this.prisma.order.create({
    data: {
      ...dto,
      businessId: user.businessId,  // Never trust client input
      employeeId: user.employeeId,
    },
  });
  
  return order;
}
```

## Rules and Guidelines

### ✅ DO

1. **Always filter by `businessId`** in service layer queries
2. **Use `@BusinessScoped()` decorator** on business-scoped endpoints
3. **Validate ownership** when fetching single resources by ID
4. **Use `user.businessId` from token** - never trust client input
5. **Log tenant isolation violations** (already in BusinessScopeGuard)
6. **Test tenant isolation** in integration tests

### ❌ DON'T

1. **Never trust `businessId` from request body/params** without validation
2. **Never skip `businessId` filtering** in queries
3. **Never expose other businesses' data** even if query doesn't filter
4. **Never implement business logic only in frontend** - always validate on backend
5. **Never bypass guards** for "convenience"

## Testing Tenant Isolation

### Integration Test Example

```typescript
describe('Tenant Isolation', () => {
  it('should prevent BUSINESS_ADMIN from accessing other business invoices', async () => {
    // Create two businesses
    const business1 = await createBusiness();
    const business2 = await createBusiness();
    
    // Create admin for business1
    const admin1 = await createBusinessAdmin(business1.id);
    
    // Create invoice for business2
    const invoice2 = await createInvoice(business2.id);
    
    // Try to access business2's invoice as business1 admin
    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice2.id}`)
      .set('Authorization', `Bearer ${admin1.token}`)
      .expect(403);
    
    expect(response.body.message).toContain('Access denied');
  });
});
```

## Checklist for New Endpoints

When creating a new endpoint that accesses business data:

- [ ] Is the endpoint marked with `@BusinessScoped()` if it should be business-scoped?
- [ ] Does the service method filter by `businessId` or `employeeId`?
- [ ] Is ownership validated for single resource lookups?
- [ ] Are guards applied at controller level?
- [ ] Is `businessId` taken from user token, not request?
- [ ] Are integration tests written for tenant isolation?

## Related Files

- `apps/backend/src/auth/guards/business-scope.guard.ts` - Guard implementation
- `apps/backend/src/auth/decorators/business-scoped.decorator.ts` - Decorator
- `apps/backend/src/invoices/invoices.controller.ts` - Example usage
- `apps/backend/src/employees/business-employees.controller.ts` - Example usage

## References

- [Overriding Rule](../rules.md) - Security > clarity > speed > features
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
