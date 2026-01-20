# Production Runbook for Ramadan Operations

## Quick Reference

### Critical Endpoints

| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/health` | GET | Public | Health check |
| `/system/status` | GET | ADMIN | System status |
| `/system/ordering/lock` | POST | SUPER_ADMIN | Manual lock ordering |
| `/system/ordering/unlock` | POST | SUPER_ADMIN | Manual unlock ordering |
| `/ops/lock-day` | POST | SUPER_ADMIN | Lock day (moves orders to LOCKED) |
| `/ops/summary` | GET | SUPER_ADMIN | Kitchen summary |
| `/ops/business-summary` | GET | SUPER_ADMIN | Business breakdown |
| `/orders/admin` | GET | SUPER_ADMIN | All orders |
| `/invoices/generate` | POST | SUPER_ADMIN | Generate invoices |

### Default Credentials (Change in Production!)

- SUPER_ADMIN: `admin@cheznoura.tn` / `password123`
- BUSINESS_ADMIN: `business-admin@example-company.tn` / `password123`
- EMPLOYEE: `employee@example-company.tn` (email-based auth)

## Daily Workflow

### 1. Morning Setup (Before 10:00 AM)

```bash
# 1. Check system health
curl http://localhost:3000/health

# 2. Check system status
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/system/status

# 3. Verify meals exist for today
TODAY=$(date +%Y-%m-%d)
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/meals?date=$TODAY"
```

**Expected Results:**
- Health check returns 200
- System status shows database operational
- At least one meal exists for today

### 2. During Ordering Window (10:00 AM - 2:00 PM)

**Monitor:**
- Order creation rate
- Error logs
- System resources

**If Issues:**
- See "Emergency Procedures" section

### 3. After Cutoff (2:00 PM)

```bash
# 1. Lock the day
TODAY=$(date +%Y-%m-%d)
curl -X POST "http://localhost:3000/ops/lock-day?date=$TODAY" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"

# 2. Get kitchen summary
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/ops/summary?date=$TODAY"

# 3. Get business summary (if needed)
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/ops/business-summary?date=$TODAY"

# 4. Export CSV (if needed)
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/ops/summary?date=$TODAY&format=csv" \
  -o kitchen-summary-$TODAY.csv
```

**Verify:**
- All orders are in LOCKED status
- Quantities match expectations
- No missing orders

### 4. End of Day

```bash
# 1. Review all orders
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/orders/admin"

# 2. Check for errors in logs
# (Use your logging system)

# 3. Generate invoices (if weekly)
START_DATE=$(date -d "last monday" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl -X POST \
  "http://localhost:3000/invoices/generate?start=$START_DATE&end=$END_DATE" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

## Common Scenarios

### Scenario 1: Employee Cannot Place Order

**Symptoms:**
- Employee sees error when trying to place order
- Order creation fails

**Diagnosis:**
```bash
# 1. Check if ordering is locked
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/system/status"

# 2. Check employee's existing orders
curl -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  "http://localhost:3000/orders/me"

# 3. Check meals for date
TODAY=$(date +%Y-%m-%d)
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/meals?date=$TODAY"
```

**Common Causes:**
1. Already placed order for today (duplicate prevention working)
2. Cutoff time passed
3. Ordering manually locked
4. No meals available for date
5. Backend error (check logs)

**Resolution:**
- If duplicate: Inform employee they already have an order
- If cutoff: Extend cutoff or inform employee it's too late
- If no meals: Create meals immediately
- If backend error: See "Backend Degraded" procedure

### Scenario 2: Cutoff Time Needs Extension

**Symptoms:**
- Business requests extension
- Orders still coming in after cutoff

**Resolution:**
```bash
# 1. Unlock ordering
TODAY=$(date +%Y-%m-%d)
curl -X POST "http://localhost:3000/system/ordering/unlock" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"date\": \"$TODAY\"}"

# 2. Monitor ordering window

# 3. Lock when ready
curl -X POST "http://localhost:3000/ops/lock-day?date=$TODAY" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

### Scenario 3: Backend Restart During Ordering

**Symptoms:**
- Backend goes down
- Employees cannot place orders
- Orders may be in inconsistent state

**Resolution:**
```bash
# 1. Restart backend
# (Use your deployment process)

# 2. Verify system health
curl http://localhost:3000/health

# 3. Check orders for inconsistencies
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/orders/admin" | jq '.[] | select(.status == "CREATED")'

# 4. Verify idempotency is working
# (Test with dry-run script)

# 5. If orders are missing, check database directly
```

**Note:** Idempotency keys should prevent duplicate orders after restart.

### Scenario 4: Missing Meals for Date

**Symptoms:**
- Employees see "No meals available"
- Kitchen summary shows 0 meals

**Resolution:**
```bash
# 1. Create meals immediately
curl -X POST "http://localhost:3000/meals" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Iftar Meal",
    "description": "Traditional iftar meal",
    "price": 25.00,
    "availableDate": "2024-03-15T00:00:00.000Z",
    "cutoffTime": "2024-03-15T14:00:00.000Z",
    "isActive": true,
    "status": "ACTIVE"
  }'

# 2. Verify meals are visible
TODAY=$(date +%Y-%m-%d)
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/meals?date=$TODAY"
```

### Scenario 5: Kitchen Summary Shows Wrong Quantities

**Symptoms:**
- Kitchen summary doesn't match expected quantities
- Missing or extra orders

**Diagnosis:**
```bash
# 1. Check all orders for the date
TODAY=$(date +%Y-%m-%d)
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/orders/admin" | \
  jq ".[] | select(.orderDate | startswith(\"$TODAY\"))"

# 2. Check order statuses
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/orders/admin" | \
  jq ".[] | select(.orderDate | startswith(\"$TODAY\")) | {id, status, totalAmount}"

# 3. Verify day is locked
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/ops/summary?date=$TODAY" | jq '.lockedAt'
```

**Common Causes:**
1. Day not locked (summary only shows LOCKED orders)
2. Orders in CREATED status instead of LOCKED
3. Orders cancelled but still counted
4. Database inconsistency

**Resolution:**
- If day not locked: Lock the day
- If orders in wrong status: Check why lock-day didn't work
- If database issue: Check database directly, may need manual fix

## Scripts

### Run Dry Run Test

```bash
cd /path/to/project
ts-node scripts/dry-run-e2e.ts
```

### Run Failure Scenarios

```bash
cd /path/to/project
ts-node scripts/failure-scenarios.ts
```

### Check System Health

```bash
#!/bin/bash
API_URL="http://localhost:3000"
TOKEN="<SUPER_ADMIN_TOKEN>"

echo "Checking system health..."
HEALTH=$(curl -s "$API_URL/health")
echo "Health: $HEALTH"

echo "Checking system status..."
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/system/status")
echo "Status: $STATUS"

TODAY=$(date +%Y-%m-%d)
echo "Checking meals for today ($TODAY)..."
MEALS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/meals?date=$TODAY")
MEAL_COUNT=$(echo $MEALS | jq '. | length')
echo "Meals available: $MEAL_COUNT"
```

## Database Queries

### Check Orders for a Date

```sql
SELECT 
  o.id,
  o."orderDate",
  o.status,
  o."totalAmount",
  e.email as employee_email,
  b.name as business_name
FROM "Order" o
JOIN "Employee" e ON o."employeeId" = e.id
JOIN "Business" b ON o."businessId" = b.id
WHERE DATE(o."orderDate") = '2024-03-15'
ORDER BY o."createdAt";
```

### Check Order Status Distribution

```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM("totalAmount") as total_amount
FROM "Order"
WHERE DATE("orderDate") = '2024-03-15'
GROUP BY status;
```

### Check Kitchen Summary (Manual)

```sql
SELECT 
  m.name as meal_name,
  SUM(oi.quantity) as total_quantity,
  oi."unitPrice",
  SUM(oi.quantity * oi."unitPrice") as total_amount
FROM "OrderItem" oi
JOIN "Meal" m ON oi."mealId" = m.id
JOIN "Order" o ON oi."orderId" = o.id
WHERE DATE(o."orderDate") = '2024-03-15'
  AND o.status = 'LOCKED'
GROUP BY m.id, m.name, oi."unitPrice"
ORDER BY m.name;
```

## Troubleshooting

### Backend Won't Start

1. Check environment variables
2. Check database connectivity
3. Check port availability
4. Check logs for errors

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check database server is running
3. Check network connectivity
4. Verify credentials
5. Check connection pool limits

### Orders Not Locking

1. Verify SUPER_ADMIN token is valid
2. Check date format (YYYY-MM-DD)
3. Check if day already locked
4. Verify orders exist for date
5. Check database transaction logs

### Invoice Generation Fails

1. Verify period dates are correct
2. Check if invoices already exist
3. Verify orders exist for period
4. Check database constraints
5. Verify SUPER_ADMIN permissions

## Support Contacts

- **Technical Lead:** [Contact Info]
- **Database Admin:** [Contact Info]
- **DevOps:** [Contact Info]
- **Business Owner:** [Contact Info]

## Escalation Path

1. **Level 1:** Check runbook, try common solutions
2. **Level 2:** Contact technical lead
3. **Level 3:** Contact database admin
4. **Level 4:** Contact DevOps
5. **Level 5:** Contact business owner (for business decisions)
