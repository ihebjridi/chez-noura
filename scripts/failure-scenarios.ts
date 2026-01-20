/**
 * Failure Scenario Simulation Script
 * 
 * Tests critical failure scenarios:
 * 1. Duplicate order attempts
 * 2. Late orders after cutoff
 * 3. Missing meals for a date
 * 4. Backend restart during ordering window
 * 
 * Usage: ts-node scripts/failure-scenarios.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestResult {
  scenario: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class FailureScenarios {
  private superAdminToken: string = '';
  private employeeToken: string = '';
  private testDate: string = '';
  private mealIds: string[] = [];

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private log(message: string, data?: any) {
    console.log(`\n${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Setup: Authenticate and create test data
   */
  async setup(): Promise<void> {
    this.log('🔧 Setting up test environment...');
    
    // Authenticate SUPER_ADMIN
    const adminResponse = await this.request<{ accessToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@cheznoura.tn',
          password: 'password123',
        }),
      },
    );
    this.superAdminToken = adminResponse.accessToken;

    // Authenticate EMPLOYEE
    const employeeResponse = await this.request<{ accessToken: string }>(
      '/auth/login/employee',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'employee@example-company.tn',
        }),
      },
    );
    this.employeeToken = employeeResponse.accessToken;

    // Set test date to tomorrow
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    this.testDate = testDate.toISOString().split('T')[0];

    // Create test meals
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() + 2);

    const meal = {
      name: 'Test Meal for Failure Scenarios',
      description: 'Test meal',
      price: 20.00,
      availableDate: `${this.testDate}T00:00:00.000Z`,
      cutoffTime: cutoffTime.toISOString(),
      isActive: true,
      status: 'ACTIVE',
    };

    const created = await this.request<any>(
      '/meals',
      {
        method: 'POST',
        body: JSON.stringify(meal),
      },
      this.superAdminToken,
    );
    this.mealIds.push(created.id);

    this.log('✅ Setup complete', {
      testDate: this.testDate,
      mealId: this.mealIds[0],
    });
  }

  /**
   * Scenario 1: Duplicate order attempts
   */
  async scenario1_DuplicateOrders(): Promise<TestResult> {
    this.log('\n📋 Scenario 1: Duplicate Order Attempts');
    this.log('Testing: Employee attempts to place multiple orders for the same date');

    try {
      // Ensure ordering is unlocked
      await this.request(
        '/system/ordering/unlock',
        {
          method: 'POST',
          body: JSON.stringify({ date: this.testDate }),
        },
        this.superAdminToken,
      ).catch(() => {});

      // First order should succeed
      const order1 = {
        orderDate: this.testDate,
        items: [{ mealId: this.mealIds[0], quantity: 1 }],
      };

      const idempotencyKey1 = `duplicate-test-${Date.now()}`;
      const created1 = await this.request<any>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify(order1),
          headers: {
            'x-idempotency-key': idempotencyKey1,
          },
        },
        this.employeeToken,
      );

      this.log('✅ First order created', { orderId: created1.id });

      // Second order for same date should fail
      try {
        const order2 = {
          orderDate: this.testDate,
          items: [{ mealId: this.mealIds[0], quantity: 2 }],
        };

        const idempotencyKey2 = `duplicate-test-${Date.now() + 1}`;
        await this.request<any>(
          '/orders',
          {
            method: 'POST',
            body: JSON.stringify(order2),
            headers: {
              'x-idempotency-key': idempotencyKey2,
            },
          },
          this.employeeToken,
        );

        return {
          scenario: 'Duplicate Order Attempts',
          passed: false,
          error: 'Second order was accepted - duplicate prevention failed!',
        };
      } catch (error: any) {
        if (
          error.message.includes('already ordered') ||
          error.message.includes('duplicate') ||
          error.message.includes('Conflict') ||
          error.message.includes('Unique constraint')
        ) {
          this.log('✅ Duplicate order correctly rejected');
          return {
            scenario: 'Duplicate Order Attempts',
            passed: true,
            details: { firstOrderId: created1.id },
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      return {
        scenario: 'Duplicate Order Attempts',
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Scenario 2: Late orders after cutoff
   */
  async scenario2_LateOrdersAfterCutoff(): Promise<TestResult> {
    this.log('\n📋 Scenario 2: Late Orders After Cutoff');
    this.log('Testing: Employee attempts to place order after cutoff time');

    try {
      // Use a different date for this test
      const testDate2 = new Date();
      testDate2.setDate(testDate2.getDate() + 2);
      const dateStr = testDate2.toISOString().split('T')[0];

      // Create meal with past cutoff time
      const pastCutoff = new Date();
      pastCutoff.setHours(pastCutoff.getHours() - 1); // 1 hour ago

      const meal = {
        name: 'Test Meal - Past Cutoff',
        description: 'Test meal',
        price: 20.00,
        availableDate: `${dateStr}T00:00:00.000Z`,
        cutoffTime: pastCutoff.toISOString(),
        isActive: true,
        status: 'ACTIVE',
      };

      const createdMeal = await this.request<any>(
        '/meals',
        {
          method: 'POST',
          body: JSON.stringify(meal),
        },
        this.superAdminToken,
      );

      // Attempt to place order
      try {
        const order = {
          orderDate: dateStr,
          items: [{ mealId: createdMeal.id, quantity: 1 }],
        };

        await this.request<any>(
          '/orders',
          {
            method: 'POST',
            body: JSON.stringify(order),
          },
          this.employeeToken,
        );

        return {
          scenario: 'Late Orders After Cutoff',
          passed: false,
          error: 'Order was accepted after cutoff - cutoff enforcement failed!',
        };
      } catch (error: any) {
        if (
          error.message.includes('cutoff') ||
          error.message.includes('cut-off') ||
          error.message.includes('Ordering cutoff')
        ) {
          this.log('✅ Late order correctly rejected');
          return {
            scenario: 'Late Orders After Cutoff',
            passed: true,
            details: { cutoffTime: pastCutoff.toISOString() },
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      return {
        scenario: 'Late Orders After Cutoff',
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Scenario 3: Missing meals for a date
   */
  async scenario3_MissingMealsForDate(): Promise<TestResult> {
    this.log('\n📋 Scenario 3: Missing Meals for a Date');
    this.log('Testing: Employee attempts to order when no meals are available');

    try {
      // Use a different date with no meals
      const testDate3 = new Date();
      testDate3.setDate(testDate3.getDate() + 3);
      const dateStr = testDate3.toISOString().split('T')[0];

      // Attempt to place order
      try {
        const order = {
          orderDate: dateStr,
          items: [{ mealId: this.mealIds[0], quantity: 1 }],
        };

        await this.request<any>(
          '/orders',
          {
            method: 'POST',
            body: JSON.stringify(order),
          },
          this.employeeToken,
        );

        return {
          scenario: 'Missing Meals for a Date',
          passed: false,
          error: 'Order was accepted with no meals available - validation failed!',
        };
      } catch (error: any) {
        if (
          error.message.includes('No meals available') ||
          error.message.includes('not found') ||
          error.message.includes('not available')
        ) {
          this.log('✅ Missing meals correctly handled');
          return {
            scenario: 'Missing Meals for a Date',
            passed: true,
            details: { testDate: dateStr },
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      return {
        scenario: 'Missing Meals for a Date',
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Scenario 4: Backend restart during ordering window
   * (Simulated by checking idempotency and data consistency)
   */
  async scenario4_BackendRestartSimulation(): Promise<TestResult> {
    this.log('\n📋 Scenario 4: Backend Restart During Ordering Window');
    this.log('Testing: Idempotency and data consistency after simulated restart');

    try {
      // Use a different date
      const testDate4 = new Date();
      testDate4.setDate(testDate4.getDate() + 4);
      const dateStr = testDate4.toISOString().split('T')[0];

      // Create meal
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() + 2);

      const meal = {
        name: 'Test Meal - Restart Simulation',
        description: 'Test meal',
        price: 20.00,
        availableDate: `${dateStr}T00:00:00.000Z`,
        cutoffTime: cutoffTime.toISOString(),
        isActive: true,
        status: 'ACTIVE',
      };

      const createdMeal = await this.request<any>(
        '/meals',
        {
          method: 'POST',
          body: JSON.stringify(meal),
        },
        this.superAdminToken,
      );

      // Place order with idempotency key
      const idempotencyKey = `restart-test-${Date.now()}`;
      const order = {
        orderDate: dateStr,
        items: [{ mealId: createdMeal.id, quantity: 1 }],
      };

      const order1 = await this.request<any>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify(order),
          headers: {
            'x-idempotency-key': idempotencyKey,
          },
        },
        this.employeeToken,
      );

      this.log('✅ First order created', { orderId: order1.id });

      // Simulate restart: attempt same order with same idempotency key
      // In a real scenario, this would be after a restart
      // The system should either return the existing order or reject it
      try {
        const order2 = await this.request<any>(
          '/orders',
          {
            method: 'POST',
            body: JSON.stringify(order),
            headers: {
              'x-idempotency-key': idempotencyKey,
            },
          },
          this.employeeToken,
        );

        // If we get here, check if it's the same order or a new one
        if (order2.id === order1.id) {
          this.log('✅ Idempotency working - same order returned');
          return {
            scenario: 'Backend Restart During Ordering Window',
            passed: true,
            details: {
              orderId: order1.id,
              idempotencyKey,
              sameOrderReturned: true,
            },
          };
        } else {
          return {
            scenario: 'Backend Restart During Ordering Window',
            passed: false,
            error: 'Different order created with same idempotency key',
          };
        }
      } catch (error: any) {
        // If duplicate order error, that's also acceptable
        if (
          error.message.includes('already ordered') ||
          error.message.includes('duplicate')
        ) {
          this.log('✅ Duplicate prevention working');
          return {
            scenario: 'Backend Restart During Ordering Window',
            passed: true,
            details: {
              orderId: order1.id,
              idempotencyKey,
              duplicatePrevented: true,
            },
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      return {
        scenario: 'Backend Restart During Ordering Window',
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Run all failure scenarios
   */
  async run(): Promise<void> {
    console.log('\n🧪 Starting Failure Scenario Tests\n');
    console.log('='.repeat(60));

    try {
      await this.setup();

      const results: TestResult[] = [];

      results.push(await this.scenario1_DuplicateOrders());
      results.push(await this.scenario2_LateOrdersAfterCutoff());
      results.push(await this.scenario3_MissingMealsForDate());
      results.push(await this.scenario4_BackendRestartSimulation());

      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('\n📊 TEST RESULTS SUMMARY\n');

      let passedCount = 0;
      let failedCount = 0;

      for (const result of results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.scenario}`);
        if (!result.passed) {
          console.log(`   Error: ${result.error}`);
        }
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details)}`);
        }

        if (result.passed) {
          passedCount++;
        } else {
          failedCount++;
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log(`\nTotal: ${results.length} scenarios`);
      console.log(`✅ Passed: ${passedCount}`);
      console.log(`❌ Failed: ${failedCount}`);

      if (failedCount > 0) {
        console.log('\n❌ SOME SCENARIOS FAILED - REVIEW BEFORE PRODUCTION');
        process.exit(1);
      } else {
        console.log('\n✅ ALL SCENARIOS PASSED - SYSTEM IS RESILIENT');
      }
    } catch (error) {
      console.error('\n❌ FATAL ERROR:', error);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const scenarios = new FailureScenarios();
  scenarios.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FailureScenarios };
