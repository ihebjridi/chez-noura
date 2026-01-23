'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../lib/api-client';
import { EmployeeDto, CreateEmployeeDto, EntityStatus, OrderDto } from '@contracts/core';
import { useAuth } from '../../contexts/auth-context';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { UserPlus, CheckCircle2, XCircle, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeDto>({
    email: '',
    firstName: '',
    lastName: '',
    businessId: user?.businessId || '',
  });

  useEffect(() => {
    if (user?.businessId) {
      loadEmployees();
      loadOrders();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await apiClient.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await apiClient.getBusinessOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Group orders by employee
  const ordersByEmployee = useMemo(() => {
    const grouped: Record<string, OrderDto[]> = {};
    orders.forEach((order) => {
      if (!grouped[order.employeeId]) {
        grouped[order.employeeId] = [];
      }
      grouped[order.employeeId].push(order);
    });
    return grouped;
  }, [orders]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    try {
      setError('');
      setSuccess('');
      await apiClient.createEmployee({ ...formData, businessId: user.businessId });
      setShowInviteForm(false);
      setFormData({ email: '', firstName: '', lastName: '', businessId: user.businessId });
      setSuccess('Employee created successfully!');
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    }
  };

  const handleDisable = async (employeeId: string) => {
    if (!confirm('Are you sure you want to disable this employee? They will not be able to place new orders.')) return;

    try {
      setError('');
      setSuccess('');
      await apiClient.updateEmployee(employeeId, { status: EntityStatus.INACTIVE });
      setSuccess('Employee disabled successfully');
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to disable employee');
    }
  };

  const handleEnable = async (employeeId: string) => {
    try {
      setError('');
      setSuccess('');
      await apiClient.updateEmployee(employeeId, { status: EntityStatus.ACTIVE });
      setSuccess('Employee enabled successfully');
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to enable employee');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">Manage employee accounts and invitations</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={loadEmployees} />
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-success-50 border border-success-300 text-success-700 rounded-lg">
          <p className="text-sm font-normal">{success}</p>
        </div>
      )}

      {/* Inline Invite Form */}
      <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
        >
          <span className="font-semibold">Invite New Employee</span>
          <span className="text-gray-500">{showInviteForm ? '−' : '+'}</span>
        </button>
        {showInviteForm && (
          <div className="px-6 py-4 border-t border-surface-dark">
            <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="employee@company.com"
                className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="John"
                className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Doe"
                className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Send Invitation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setFormData({ email: '', firstName: '', lastName: '', businessId: user?.businessId || '' });
                }}
                className="px-4 py-2 bg-surface text-gray-700 font-medium rounded-lg hover:bg-surface-dark transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading employees..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && employees.length === 0 && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No employees found"
            description="Invite your first employee to get started."
          />
        </div>
      )}

      {/* Employee List */}
      {!loading && employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => {
            const employeeOrders = ordersByEmployee[employee.id] || [];
            const totalOrders = employeeOrders.length;
            const totalSpent = employeeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

            return (
              <div
                key={employee.id}
                className="bg-surface border border-surface-dark rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
                  </div>
                  {employee.status === EntityStatus.ACTIVE ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                </div>
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === EntityStatus.ACTIVE
                        ? 'bg-success-50 text-success-700 border border-success-300'
                        : 'bg-destructive/10 text-destructive border border-destructive/30'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>

                {/* Order Summary */}
                <div className="mb-4 p-3 bg-surface-light rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">Orders:</span>
                    </div>
                    <span className="font-semibold text-gray-900">{totalOrders}</span>
                  </div>
                  {totalOrders > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-semibold text-gray-900">
                        {totalSpent.toFixed(2)} TND
                      </span>
                    </div>
                  )}
                </div>

                {/* View Orders Button */}
                {totalOrders > 0 && (
                  <button
                    onClick={() =>
                      setExpandedEmployeeId(expandedEmployeeId === employee.id ? null : employee.id)
                    }
                    className="w-full mb-4 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    {expandedEmployeeId === employee.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Orders
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View Orders ({totalOrders})
                      </>
                    )}
                  </button>
                )}

                {/* Expanded Orders List */}
                {expandedEmployeeId === employee.id && employeeOrders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-dark">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Orders</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {employeeOrders
                        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                        .map((order) => (
                          <div
                            key={order.id}
                            className="p-3 bg-surface-light rounded-lg border border-surface-dark"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="text-xs font-medium text-gray-900">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-600">{order.packName}</p>
                              </div>
                              <p className="text-xs font-semibold text-gray-900">
                                {order.totalAmount.toFixed(2)} TND
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {employee.status === EntityStatus.ACTIVE ? (
                    <button
                      onClick={() => handleDisable(employee.id)}
                      className="flex-1 px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive-hover transition-colors"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnable(employee.id)}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
