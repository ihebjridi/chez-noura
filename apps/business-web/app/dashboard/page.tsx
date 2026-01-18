'use client';

import Link from 'next/link';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { UserRole } from '@contracts/core';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Business Admin Dashboard</h1>
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

        {user && (
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Logged in as: {user.email}
          </p>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <Link href="/employees" style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: 'white'
          }}>
            <h2>Employees</h2>
            <p>Manage employee accounts</p>
          </Link>

          <Link href="/orders" style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: 'white'
          }}>
            <h2>Orders</h2>
            <p>View all employee orders</p>
          </Link>

          <Link href="/invoices" style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: 'white'
          }}>
            <h2>Invoices</h2>
            <p>View and manage invoices</p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
