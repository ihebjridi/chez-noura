# Operational Checklist for Ramadan Production

## Pre-Production Checklist

### Infrastructure
- [ ] Database backups configured and tested
- [ ] Database connection pooling optimized for expected load
- [ ] Environment variables set correctly in production
- [ ] CORS configured for production domains
- [ ] SSL/TLS certificates valid and configured
- [ ] Rate limiting configured appropriately
- [ ] Logging and monitoring set up

### Application
- [ ] All migrations applied to production database
- [ ] Seed data verified (SUPER_ADMIN user exists)
- [ ] End-to-end dry run completed successfully
- [ ] Failure scenarios tested and handled
- [ ] Read-only fallback tested for employee app
- [ ] Manual cutoff override tested

### Data
- [ ] Test data cleaned from production database
- [ ] Business data verified
- [ ] Employee data verified
- [ ] Meal data structure verified

## Daily Operations Checklist

### Morning (Before Ordering Window Opens)
- [ ] Verify backend health: `GET /health`
- [ ] Check system status: `GET /system/status`
- [ ] Verify meals are created for today
- [ ] Verify cutoff times are set correctly
- [ ] Check database connectivity
- [ ] Review previous day's orders for anomalies

### During Ordering Window (Iftar)
- [ ] Monitor backend health every 15 minutes
- [ ] Monitor order creation rate
- [ ] Watch for error rates in logs
- [ ] Verify cutoff enforcement is working
- [ ] Be ready to manually lock ordering if needed

### After Cutoff (Before Kitchen)
- [ ] Verify cutoff time has passed
- [ ] Lock the day: `POST /ops/lock-day?date=YYYY-MM-DD`
- [ ] Verify orders are in LOCKED status
- [ ] Generate kitchen summary: `GET /ops/summary?date=YYYY-MM-DD`
- [ ] Generate business summary: `GET /ops/business-summary?date=YYYY-MM-DD`
- [ ] Export CSV if needed: `GET /ops/summary?date=YYYY-MM-DD&format=csv`
- [ ] Verify quantities match expectations

### End of Day
- [ ] Review all orders for the day
- [ ] Check for any failed order attempts
- [ ] Verify invoice generation if needed
- [ ] Review error logs
- [ ] Document any issues or anomalies

## Weekly Operations Checklist

- [ ] Generate invoices for the week: `POST /invoices/generate?start=YYYY-MM-DD&end=YYYY-MM-DD`
- [ ] Review invoice accuracy
- [ ] Check database size and performance
- [ ] Review and clean up old cached data
- [ ] Review error logs for patterns
- [ ] Update meal data for next week

## Emergency Procedures

### Backend Degraded During Ordering Window

1. **Immediate Actions:**
   - Check backend logs for errors
   - Verify database connectivity
   - Check system resources (CPU, memory, disk)
   - Restart backend if necessary

2. **If Backend Cannot Be Restored Quickly:**
   - Employee app will automatically use cached data (read-only mode)
   - Employees can view their orders but cannot place new ones
   - Communicate status to business admins

3. **After Backend Restored:**
   - Verify all orders are intact
   - Check for any missing orders
   - Extend cutoff time if needed: `POST /system/ordering/unlock` then manually lock later

### Cutoff Time Issues

1. **If Cutoff Needs to Be Extended:**
   ```
   POST /system/ordering/unlock
   Body: { "date": "YYYY-MM-DD" }
   ```
   - Monitor ordering window
   - Manually lock when ready: `POST /ops/lock-day?date=YYYY-MM-DD`

2. **If Cutoff Passed But Orders Still Needed:**
   - Use manual unlock (SUPER_ADMIN only)
   - Set new cutoff time by updating meal cutoffTime
   - Or manually lock when done: `POST /ops/lock-day?date=YYYY-MM-DD`

### Missing Meals for a Date

1. **If Meals Not Created:**
   - Create meals immediately: `POST /meals`
   - Set appropriate cutoff time
   - Notify employees if ordering window is open

2. **If Meals Created But Not Showing:**
   - Verify meal `availableDate` matches order date
   - Verify meal `isActive` is true
   - Verify meal `status` is ACTIVE
   - Check cutoff time hasn't passed

### Duplicate Orders

1. **If Duplicate Order Detected:**
   - System should automatically reject (unique constraint)
   - Check employee's existing order: `GET /orders/me`
   - If legitimate duplicate needed, delete old order first (manual DB operation)

### Database Issues

1. **If Database Connection Lost:**
   - Check database server status
   - Verify connection string
   - Check database logs
   - Restart database if necessary
   - Verify backups are current

2. **If Data Corruption Suspected:**
   - Stop accepting new orders immediately
   - Lock current day
   - Restore from backup if necessary
   - Verify data integrity

## Manual Override Procedures

### Manual Cutoff Override

**Unlock Ordering:**
```bash
curl -X POST http://localhost:3000/system/ordering/unlock \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-03-15"}'
```

**Lock Ordering:**
```bash
curl -X POST http://localhost:3000/system/ordering/lock \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-03-15"}'
```

### Manual Day Lock

**Lock Day (moves orders to LOCKED status):**
```bash
curl -X POST "http://localhost:3000/ops/lock-day?date=2024-03-15" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

### Manual Order Status Check

**Get All Orders for a Date:**
```bash
curl -X GET "http://localhost:3000/orders/admin" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Order Creation Rate**
   - Expected: High during ordering window
   - Alert if: Sudden drop or spike

2. **Error Rate**
   - Expected: < 1% of requests
   - Alert if: > 5% of requests

3. **Response Time**
   - Expected: < 500ms for most endpoints
   - Alert if: > 2 seconds

4. **Database Connections**
   - Expected: Within connection pool limits
   - Alert if: Approaching limits

5. **Cutoff Time Compliance**
   - Expected: 100% of orders before cutoff
   - Alert if: Orders accepted after cutoff

### Log Monitoring

Monitor for:
- 5xx errors (server errors)
- 4xx errors (client errors, especially cutoff violations)
- Database connection errors
- Order creation failures
- Authentication failures

## Recovery Procedures

### After Backend Restart

1. Verify database connectivity
2. Check system status: `GET /system/status`
3. Verify orders are intact: `GET /orders/admin`
4. Check for any orders in inconsistent state
5. Verify cutoff enforcement still working
6. Test order creation with test employee

### After Database Restore

1. Verify all tables exist
2. Run migrations if needed
3. Verify seed data (SUPER_ADMIN user)
4. Check order data integrity
5. Verify foreign key constraints
6. Test order creation flow

## Communication Plan

### During Incidents

1. **Internal Team:**
   - Use dedicated Slack/Teams channel
   - Post status updates every 15 minutes
   - Document all actions taken

2. **Business Admins:**
   - Email/SMS for critical issues
   - Status page if available
   - Phone call for extended outages

3. **Employees:**
   - In-app notification if possible
   - Email if backend is down
   - SMS for critical issues

## Post-Incident Review

After any incident:
1. Document what happened
2. Document what was done
3. Identify root cause
4. Create action items to prevent recurrence
5. Update this checklist if needed
