'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { InvoiceSummaryDto, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function InvoicesPage() {
  const { logout } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual endpoint once backend is implemented
      // const data = await apiClient.getInvoices();
      // setInvoices(data);
      setInvoices([]); // Placeholder
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Invoices</h1>
          </div>
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

        {loading ? (
          <p>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No invoices found.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Note: Backend endpoints for invoices are not yet implemented.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>Invoice #{invoice.invoiceNumber}</h3>
                    <p>Period: {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{invoice.total.toFixed(2)} TND</p>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: invoice.status === 'PAID' ? '#d4edda' : invoice.status === 'SENT' ? '#d1ecf1' : invoice.status === 'OVERDUE' ? '#f8d7da' : '#e2e3e5',
                      color: invoice.status === 'PAID' ? '#155724' : invoice.status === 'SENT' ? '#0c5460' : invoice.status === 'OVERDUE' ? '#721c24' : '#383d41',
                      fontSize: '0.9rem'
                    }}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
