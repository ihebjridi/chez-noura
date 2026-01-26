4️⃣ AI-FIRST RULES (VERY IMPORTANT)
🔒 Rule 1: No Cross-App Imports (Except packages)

Frontends never import backend code.

Shared logic lives in:

packages/contracts

🔁 Rule 2: API Is the Contract

Backend defines routes

Frontends consume typed clients

No hidden coupling

🔐 Rule 3: Tenant Isolation (CRITICAL SECURITY)

Tenant isolation is enforced at multiple layers:

1. **Guard Layer**: Use `@BusinessScoped()` decorator on business-scoped endpoints
2. **Service Layer**: Always filter by `businessId` or `employeeId` in database queries
3. **Controller Layer**: Apply `BusinessScopeGuard` to controllers accessing tenant data

Key principles:
- Never trust `businessId` from client input - always use `user.businessId` from token
- Always validate ownership when fetching single resources by ID
- SUPER_ADMIN has global access, BUSINESS_ADMIN/EMPLOYEE are scoped to their business
- Security > clarity > speed > features

See `docs/TENANT_ISOLATION.md` for detailed patterns and guidelines.