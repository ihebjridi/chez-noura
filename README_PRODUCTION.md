# Production Readiness Package - Quick Reference

## What's Included

This package provides everything needed to safely operate the B2B corporate catering platform during the critical Ramadan Iftar ordering window.

### ✅ Complete Package Contents

1. **End-to-End Dry Run Script** (`scripts/dry-run-e2e.ts`)
   - Tests complete business flow from business creation to invoice generation
   - Validates all critical paths
   - Run before production: `ts-node scripts/dry-run-e2e.ts`

2. **Failure Scenario Tests** (`scripts/failure-scenarios.ts`)
   - Tests duplicate order prevention
   - Tests late order rejection
   - Tests missing meals handling
   - Tests backend restart resilience
   - Run before production: `ts-node scripts/failure-scenarios.ts`

3. **Read-Only Fallback** (Employee App)
   - Automatic caching of meals and orders
   - Fallback to cached data when backend is down
   - Visual degraded mode indicator
   - Prevents new orders during degradation (safety)
   - Files: `apps/client-web/lib/readonly-fallback.ts`, `apps/client-web/lib/api-client.ts`

4. **Manual Cutoff Override** (Already Implemented)
   - `POST /system/ordering/lock` - Lock ordering manually
   - `POST /system/ordering/unlock` - Unlock ordering manually
   - `POST /ops/lock-day` - Lock day and move orders to LOCKED status

5. **Operational Documentation**
   - `docs/OPERATIONAL_CHECKLIST.md` - Daily and emergency procedures
   - `docs/PRODUCTION_RUNBOOK.md` - Detailed step-by-step guidance
   - `docs/PRODUCTION_READINESS.md` - Complete package overview

## Quick Start

### Before Production

```bash
# 1. Run end-to-end dry run
ts-node scripts/dry-run-e2e.ts

# 2. Run failure scenarios
ts-node scripts/failure-scenarios.ts

# 3. Review documentation
cat docs/PRODUCTION_READINESS.md
cat docs/OPERATIONAL_CHECKLIST.md
cat docs/PRODUCTION_RUNBOOK.md
```

### Daily Operations

**Morning:**
```bash
# Check system health
curl http://localhost:3000/health
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/system/status
```

**After Cutoff:**
```bash
# Lock the day
TODAY=$(date +%Y-%m-%d)
curl -X POST "http://localhost:3000/ops/lock-day?date=$TODAY" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"

# Get kitchen summary
curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "http://localhost:3000/ops/summary?date=$TODAY"
```

## Key Safety Features

### 1. Duplicate Order Prevention
- ✅ Database unique constraint: `@@unique([employeeId, orderDate])`
- ✅ Application-level check before creation
- ✅ Tested in failure scenarios

### 2. Cutoff Enforcement
- ✅ Meal-level cutoff time checking
- ✅ Manual override available (SUPER_ADMIN)
- ✅ Tested in failure scenarios

### 3. Read-Only Fallback
- ✅ Automatic caching on successful API calls
- ✅ Fallback to cache when backend unavailable
- ✅ Visual indicator for degraded mode
- ✅ Prevents new orders during degradation

### 4. Order Locking
- ✅ Day lock prevents new orders
- ✅ Moves CREATED orders to LOCKED status
- ✅ Kitchen summary only includes LOCKED orders
- ✅ Atomic transaction ensures consistency

## Emergency Procedures

### Backend Down During Ordering

1. Employee app automatically uses cached data
2. Employees can view orders (read-only)
3. New orders cannot be placed (safety)
4. Restore backend, verify orders intact

### Cutoff Needs Extension

```bash
# Unlock
curl -X POST http://localhost:3000/system/ordering/unlock \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-03-15"}'

# Lock when ready
curl -X POST "http://localhost:3000/ops/lock-day?date=2024-03-15" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

### Missing Meals

```bash
# Create meal immediately
curl -X POST "http://localhost:3000/meals" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Iftar Meal",
    "price": 25.00,
    "availableDate": "2024-03-15T00:00:00.000Z",
    "cutoffTime": "2024-03-15T14:00:00.000Z",
    "isActive": true,
    "status": "ACTIVE"
  }'
```

## Pre-Production Checklist

- [ ] Run `ts-node scripts/dry-run-e2e.ts` - All steps pass
- [ ] Run `ts-node scripts/failure-scenarios.ts` - All scenarios pass
- [ ] Test read-only fallback (stop backend, verify cached data)
- [ ] Test manual cutoff override
- [ ] Change all default passwords
- [ ] Verify database backups
- [ ] Set up monitoring and alerts
- [ ] Review operational checklists with team
- [ ] Test emergency procedures
- [ ] Document support contacts

## File Locations

```
scripts/
  ├── dry-run-e2e.ts          # End-to-end test
  └── failure-scenarios.ts    # Failure tests

apps/client-web/
  ├── lib/
  │   ├── api-client.ts           # Enhanced with fallback
  │   └── readonly-fallback.ts    # Caching service
  └── components/
      └── degraded-mode-banner.tsx # Visual indicator

docs/
  ├── PRODUCTION_READINESS.md     # Package overview
  ├── OPERATIONAL_CHECKLIST.md    # Daily procedures
  └── PRODUCTION_RUNBOOK.md       # Detailed runbook
```

## Support

For detailed procedures, see:
- **Quick Reference:** `docs/PRODUCTION_READINESS.md`
- **Daily Operations:** `docs/OPERATIONAL_CHECKLIST.md`
- **Detailed Runbook:** `docs/PRODUCTION_RUNBOOK.md`

## Important Notes

1. **Ordering Window is Critical** - Always have a plan B
2. **Test Before Production** - Run all scripts and verify
3. **Monitor Continuously** - During ordering window, check every 15 minutes
4. **Document Everything** - Log all actions during incidents
5. **Communicate Early** - Notify stakeholders of any issues

---

**Ready for Production?** Run the tests, review the docs, and follow the checklists. Good luck with Ramadan operations! 🎉
