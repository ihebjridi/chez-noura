'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';
import { EmployeeDto, CreateEmployeeDto, EntityStatus, OrderDto } from '@contracts/core';
import { useAuth } from '../../contexts/auth-context';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import React from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
      setError(err.message || t('common.messages.failedToLoad'));
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

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees;
    }
    const query = searchQuery.toLowerCase().trim();
    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const email = employee.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [employees, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, startIndex, endIndex]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    try {
      setError('');
      setSuccess('');
      await apiClient.createEmployee({ ...formData, businessId: user.businessId });
      setShowInviteForm(false);
      setFormData({ email: '', firstName: '', lastName: '', businessId: user.businessId });
      setSuccess(t('common.messages.employeeCreatedSuccess'));
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToCreateEmployee'));
    }
  };

  const handleDisable = async (employeeId: string) => {
    if (!confirm(t('common.messages.confirmDisableEmployee'))) return;

    try {
      setError('');
      setSuccess('');
      await apiClient.updateEmployee(employeeId, { status: EntityStatus.INACTIVE });
      setSuccess(t('common.messages.employeeDisabledSuccess'));
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToDisableEmployee'));
    }
  };

  const handleEnable = async (employeeId: string) => {
    try {
      setError('');
      setSuccess('');
      await apiClient.updateEmployee(employeeId, { status: EntityStatus.ACTIVE });
      setSuccess(t('common.messages.employeeEnabledSuccess'));
      await loadEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToEnableEmployee'));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">{t('employees.title')}</h1>
        <p className="text-base text-gray-600 font-medium">{t('employees.subtitle')}</p>
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
      <div className="mb-6 bg-white border-2 border-gray-200 rounded-2xl shadow-md">
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-all duration-200 rounded-t-2xl"
        >
          <span className="font-bold text-lg text-black">{t('common.buttons.inviteNewEmployee')}</span>
          <span className="text-2xl text-primary-600 font-bold">{showInviteForm ? '−' : '+'}</span>
        </button>
        {showInviteForm && (
          <div className="px-6 py-4 border-t border-surface-dark">
            <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.labels.email')} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder={t('employees.emailPlaceholder')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.labels.firstName')} *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder={t('employees.firstNamePlaceholder')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.labels.lastName')} *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder={t('employees.lastNamePlaceholder')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                {t('common.buttons.sendInvitation')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setFormData({ email: '', firstName: '', lastName: '', businessId: user?.businessId || '' });
                }}
                className="px-5 py-2.5 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md"
              >
                {t('common.buttons.cancel')}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-12">
          <Loading message={t('employees.loadingEmployees')} />
        </div>
      )}

      {/* Empty State */}
      {!loading && employees.length === 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-12">
          <Empty
            message={t('employees.noEmployees')}
            description={t('employees.noEmployeesDescription')}
          />
        </div>
      )}

      {/* Search and Employee List */}
      {!loading && employees.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md">
          {/* Search Bar */}
          <div className="p-4 border-b border-surface-dark">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('employees.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium transition-all duration-200"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                {t('employees.searchResults', { count: filteredEmployees.length, total: employees.length })}
              </p>
            )}
          </div>

          {/* Employee List Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('employees.employee')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('common.labels.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('common.labels.orders')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('common.labels.totalSpent')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('common.labels.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dark">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-600">{t('employees.noSearchResults')}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee) => {
                    const employeeOrders = ordersByEmployee[employee.id] || [];
                    const totalOrders = employeeOrders.length;
                    const totalSpent = employeeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                    const isExpanded = expandedEmployeeId === employee.id;

                    return (
                      <React.Fragment key={employee.id}>
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                {employee.status === EntityStatus.ACTIVE ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-destructive" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {employee.firstName} {employee.lastName}
                                </div>
                                <div className="text-sm text-gray-600">{employee.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                employee.status === EntityStatus.ACTIVE
                                  ? 'bg-success-50 text-success-700 border border-success-300'
                                  : 'bg-destructive/10 text-destructive border border-destructive/30'
                              }`}
                            >
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-900 font-medium">{totalOrders}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 font-medium">
                              {totalSpent.toFixed(2)} TND
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              {totalOrders > 0 && (
                                <button
                                  onClick={() =>
                                    setExpandedEmployeeId(isExpanded ? null : employee.id)
                                  }
                                  className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all duration-200 flex items-center gap-1 font-semibold border-2 border-primary-200 hover:border-primary-300 shadow-sm hover:shadow-md"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      {t('common.buttons.hideOrders')}
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      {t('employees.viewOrdersCount', { count: totalOrders })}
                                    </>
                                  )}
                                </button>
                              )}
                              {employee.status === EntityStatus.ACTIVE ? (
                                <button
                                  onClick={() => handleDisable(employee.id)}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                >
                                  {t('common.buttons.disable')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEnable(employee.id)}
                                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                >
                                  {t('common.buttons.enable')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Orders Row */}
                        {isExpanded && employeeOrders.length > 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-surface-light">
                              <div className="max-w-4xl">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  {t('common.labels.recentOrders')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                  {employeeOrders
                                    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                                    .map((order) => (
                                      <div
                                        key={order.id}
                                        className="p-3 bg-background rounded-lg border border-surface-dark"
                                      >
                                        <div className="flex justify-between items-start">
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
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-surface-dark">
              <div className="text-sm text-gray-600">
                {t('employees.showingResults', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, filteredEmployees.length),
                  total: filteredEmployees.length,
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm hover:shadow-md"
                  aria-label={t('employees.previousPage')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] min-w-[44px] transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm hover:shadow-md"
                  aria-label={t('employees.nextPage')}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State for Search */}
      {!loading && employees.length > 0 && filteredEmployees.length === 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-12">
          <Empty
            message={t('employees.noSearchResults')}
            description={t('employees.noSearchResultsDescription')}
          />
        </div>
      )}
    </div>
  );
}
