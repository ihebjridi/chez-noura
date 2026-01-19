'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { EmployeeDto, CreateEmployeeDto, EntityStatus, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function EmployeesPage() {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeDto>({
    email: '',
    firstName: '',
    lastName: '',
    businessId: user?.businessId || '',
  });

  useEffect(() => {
    if (user?.businessId) {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      // Note: Employee endpoints are not yet implemented in backend
      // This will throw an error until backend endpoints are available
      try {
        const data = await apiClient.getEmployees();
        setEmployees(data);
      } catch (apiError: any) {
        // Employee endpoints not implemented yet
        setEmployees([]);
        if (apiError.message.includes('not yet implemented')) {
          // Don't show error for unimplemented endpoints
          setError('');
        } else {
          throw apiError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    try {
      setError('');
      await apiClient.createEmployee({ ...formData, businessId: user.businessId });
      setShowInviteForm(false);
      setFormData({ email: '', firstName: '', lastName: '', businessId: user.businessId });
      await loadEmployees();
    } catch (err: any) {
      setError(err.message || 'Failed to invite employee');
    }
  };

  const handleDisable = async (employeeId: string) => {
    if (!confirm('Are you sure you want to disable this employee?')) return;

    try {
      setError('');
      await apiClient.updateEmployee(employeeId, { status: EntityStatus.INACTIVE });
      await loadEmployees();
    } catch (err: any) {
      setError(err.message || 'Failed to disable employee');
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Employees</h1>
          </div>
          <div>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showInviteForm ? 'Cancel' : '+ Invite Employee'}
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {showInviteForm && (
          <form onSubmit={handleInvite} style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
            backgroundColor: 'white'
          }}>
            <h2>Invite Employee</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send Invitation
            </button>
          </form>
        )}

        {loading ? (
          <p>Loading employees...</p>
        ) : employees.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No employees found. Invite your first employee to get started.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Note: Employee management endpoints are not yet implemented in the backend.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {employees.map((employee) => (
              <div
                key={employee.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3>{employee.firstName} {employee.lastName}</h3>
                  <p>Email: {employee.email}</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Status: {employee.status}
                  </p>
                </div>
                {employee.status === EntityStatus.ACTIVE && (
                  <button
                    onClick={() => handleDisable(employee.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Disable
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
