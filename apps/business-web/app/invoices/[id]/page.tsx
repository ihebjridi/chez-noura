'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { useAuth } from '../../../contexts/auth-context';
import { apiClient } from '../../../lib/api-client';
import { InvoiceDto, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { logout } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadInvoice(params.id as string);
    }
  }, [params.id]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual endpoint once backend is implemented
      // const data = await apiClient.getInvoice(id);
      // setInvoice(data);
      setInvoice(null); // Placeholder
      setError('Invoice detail endpoint not yet implemented in backend');
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/invoices" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Invoices</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Invoice Details</h1>
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
          <p>Loading invoice...</p>
        ) : !invoice ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>Invoice not found.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #ddd' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2>Invoice #{invoice.invoiceNumber}</h2>
              <p><strong>Business:</strong> {invoice.businessName}</p>
              <p><strong>Email:</strong> {invoice.businessEmail}</p>
              <p><strong>Period:</strong> {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {invoice.status}</p>
              {invoice.paidAt && <p><strong>Paid At:</strong> {new Date(invoice.paidAt).toLocaleString()}</p>}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3>Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Employee</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Meal</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{new Date(item.orderDate).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{item.employeeName}</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.employeeEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{item.mealName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.unitPrice.toFixed(2)} TND</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.totalPrice.toFixed(2)} TND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal:</span>
                    <span>{invoice.subtotal.toFixed(2)} TND</span>
                  </div>
                  {invoice.tax && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Tax:</span>
                      <span>{invoice.tax.toFixed(2)} TND</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                    <span>Total:</span>
                    <span>{invoice.total.toFixed(2)} TND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
