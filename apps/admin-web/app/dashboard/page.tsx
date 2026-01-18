'use client';

import Link from 'next/link';
import { ProtectedRoute } from '../../components/protected-route';
import { UserRole } from '@contracts/core';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <h1>Super Admin Dashboard</h1>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <Link href="/businesses" style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: 'white'
          }}>
            <h2>Businesses</h2>
            <p>Manage businesses</p>
          </Link>

          <Link href="/meals" style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            backgroundColor: 'white'
          }}>
            <h2>Meals</h2>
            <p>Manage meals and menus</p>
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
            <p>View all orders</p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
