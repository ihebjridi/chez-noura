# Production Readiness Package for Ramadan Operations

This package provides comprehensive tools, scripts, and documentation to ensure smooth production operations during the critical Ramadan Iftar ordering window.

## Overview

The production readiness package includes:
1. **End-to-End Dry Run Script** - Validates complete business flow
2. **Failure Scenario Tests** - Simulates and handles critical failures
3. **Read-Only Fallback** - Allows employee app to function during backend degradation
4. **Operational Checklists** - Daily and emergency procedures
5. **Production Runbook** - Step-by-step operational guidance

## Quick Start

### 1. Run End-to-End Dry Run

Before going to production, run the complete flow test:

```bash
cd /path/to/project
ts-node scripts/dry-run-e2e.ts
```

This script will:
- Authenticate as SUPER_ADMIN, BUSINESS_ADMIN, and EMPLOYEE
- Create test business and employee (or use existing)
- Create meals for test date
- Place employee orders
- Verify cutoff enforcement
- Lock day and aggregate orders
- Generate invoices

**Expected Output:** All steps should complete successfully with ✅ markers.

### 2. Run Failure Scenarios

Test critical failure handling:

```bash
cd /path/to/project
ts-node scripts/failure-scenarios.ts
```

This tests:
- Duplicate order prevention
- Late order rejection after cutoff
- Missing meals handling
- Backend restart resilience

**Expected Output:** All scenarios should pass (✅).

### 3. Review Operational Checklists

Read through:
- `docs/OPERATIONAL_CHECKLIST.md` - Daily and emergency procedures
- `docs/PRODUCTION_RUNBOOK.md` - Detailed operational guidance

## Key Features

### Safety Nets

#### 1. Manual Cutoff Override

**Already Implemented:**
- `POST /system/ordering/lock` - Manually lock ordering
- `POST /system/ordering/unlock` - Manually unlock ordering
- `POST /ops/lock-day` - Lock day and move orders to LOCKED status

**Usage:**
```bash
# Unlock ordering if cutoff needs extension
curl -X POST http://localhost:3000/system/ordering/unlock \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-03-15"}'

# Lock when ready
curl -X POST http://localhost:3000/ops/lock-day?date=2024-03-15 \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

#### 2. Read-Only Fallback for Employee App

**Implementation:**
- Automatic caching of meals and orders
- Fallback to cached data when backend is unavailable
- Visual indicator when in degraded mode
- Prevents new orders during degradation (safety)

**How It Works:**
1. Employee app caches successful API responses
2. On backend failure, app automatically uses cached data
3. Banner shows "Backend unavailable" message
4. Employees can view orders but cannot place new ones
5. When backend recovers, normal operation resumes

**Files:**
- `apps/employee-web/lib/readonly-fallback.ts` - Caching service
- `apps/employee-web/lib/api-client.ts` - Enhanced with fallback logic
- `apps/employee-web/components/degraded-mode-banner.tsx` - Visual indicator

## Daily Operations

### Morning Checklist

1. **Verify System Health**
   ```bash
   curl http://localhost:3000/health
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/system/status
   ```

2. **Verify Meals Exist**
   ```bash
   TODAY=$(date +%Y-%m-%d)
   curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/meals?date=$TODAY"
   ```

3. **Check Cutoff Times**
   - Verify meal cutoff times are set correctly
   - Ensure cutoff is before Iftar time

### During Ordering Window

1. **Monitor:**
   - Backend health (every 15 minutes)
   - Order creation rate
   - Error logs

2. **Be Ready:**
   - Manual cutoff extension if needed
   - Backend restart procedure
   - Emergency communication

### After Cutoff

1. **Lock the Day**
   ```bash
   TODAY=$(date +%Y-%m-%d)
   curl -X POST "http://localhost:3000/ops/lock-day?date=$TODAY" \
     -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
   ```

2. **Generate Kitchen Summary**
   ```bash
   curl -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
     "http://localhost:3000/ops/summary?date=$TODAY"
   ```

3. **Verify Quantities**
   - Check summary matches expectations
   - Verify all orders are LOCKED
   - Export CSV if needed

## Emergency Procedures

### Backend Degraded During Ordering

1. **Check Backend:**
   - Review logs
   - Check database connectivity
   - Verify system resources

2. **If Cannot Restore Quickly:**
   - Employee app automatically uses cached data
   - Employees can view orders (read-only)
   - New orders cannot be placed (safety)
   - Communicate status to business admins

3. **After Restoration:**
   - Verify all orders intact
   - Check for missing orders
   - Extend cutoff if needed

### Cutoff Time Issues

**Extend Cutoff:**
```bash
# 1. Unlock ordering
curl -X POST http://localhost:3000/system/ordering/unlock \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-03-15"}'

# 2. Monitor ordering

# 3. Lock when ready
curl -X POST "http://localhost:3000/ops/lock-day?date=2024-03-15" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

### Missing Meals

**Create Meals Immediately:**
```bash
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
```

## Testing Before Production

### Pre-Production Checklist

- [ ] Run end-to-end dry run: `ts-node scripts/dry-run-e2e.ts`
- [ ] Run failure scenarios: `ts-node scripts/failure-scenarios.ts`
- [ ] Test read-only fallback (simulate backend down)
- [ ] Test manual cutoff override
- [ ] Verify all credentials changed from defaults
- [ ] Test database backups
- [ ] Verify monitoring and alerts
- [ ] Review operational checklists with team

### Test Read-Only Fallback

1. **Setup:**
   - Place some orders normally
   - View menu and orders

2. **Simulate Backend Down:**
   - Stop backend server
   - Refresh employee app

3. **Verify:**
   - Cached meals are shown
   - Cached orders are shown
   - Degraded mode banner appears
   - Cannot place new orders

4. **Restore:**
   - Start backend server
   - Verify normal operation resumes

## File Structure

```
chez-noura/
├── scripts/
│   ├── dry-run-e2e.ts          # End-to-end flow test
│   └── failure-scenarios.ts     # Failure scenario tests
├── apps/
│   └── employee-web/
│       ├── lib/
│       │   ├── api-client.ts           # Enhanced with fallback
│       │   └── readonly-fallback.ts    # Caching service
│       └── components/
│           └── degraded-mode-banner.tsx # Visual indicator
└── docs/
    ├── PRODUCTION_READINESS.md   # This file
    ├── OPERATIONAL_CHECKLIST.md  # Daily procedures
    └── PRODUCTION_RUNBOOK.md     # Detailed runbook
```

## Key Constraints Respected

✅ **No New Business Features**
- All additions are operational/safety focused
- No changes to core business logic
- Only safety nets and operational tools

✅ **Focus on Correctness and Recovery**
- Idempotency verified
- Duplicate prevention tested
- Cutoff enforcement verified
- Recovery procedures documented

✅ **Minimal Code Changes**
- Read-only fallback is minimal addition
- Degraded mode banner is simple component
- Operational scripts are separate from core code

## Support

For issues or questions:
1. Check `PRODUCTION_RUNBOOK.md` for detailed procedures
2. Review `OPERATIONAL_CHECKLIST.md` for checklists
3. Run dry-run and failure scenario scripts for diagnostics
4. Check logs for error details

## Next Steps

1. **Before Production:**
   - Run all tests
   - Review all documentation
   - Train operations team
   - Set up monitoring

2. **During Production:**
   - Follow daily checklists
   - Monitor system health
   - Be ready for emergencies

3. **After Production:**
   - Review incidents
   - Update documentation
   - Improve procedures

---

**Remember:** The ordering window is critical. Always have a plan B, and test your recovery procedures before you need them.
