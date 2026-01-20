'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import {
  InvoiceSummaryDto,
  InvoiceDto,
  InvoiceStatus,
  UserRole,
} from '@contracts/core';
import Link from 'next/link';

export default function InvoicesPage() {
  const { logout } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateStart, setGenerateStart] = useState('');
  const [generateEnd, setGenerateEnd] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getAdminInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetail = async (id: string) => {
    try {
      setError('');
      const data = await apiClient.getInvoiceById(id);
      setSelectedInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice details');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateStart || !generateEnd) {
      setError('Please provide both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiClient.generateInvoices(generateStart, generateEnd);
      setShowGenerateForm(false);
      setGenerateStart('');
      setGenerateEnd('');
      await loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return { bg: '#d4edda', color: '#155724' };
      case InvoiceStatus.ISSUED:
        return { bg: '#fff3cd', color: '#856404' };
      case InvoiceStatus.DRAFT:
        return { bg: '#d1ecf1', color: '#0c5460' };
      default:
        return { bg: '#f5f5f5', color: '#666' };
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <Link
              href="/dashboard"
              style={{ marginRight: '1rem', textDecoration: 'none' }}
            >
              ← Dashboard
            </Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Invoices</h1>
          </div>
          <div>
            <button
              onClick={() => setShowGenerateForm(!showGenerateForm)}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {showGenerateForm ? 'Cancel' : '+ Generate Invoices'}
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {showGenerateForm && (
          <form
            onSubmit={handleGenerate}
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '2rem',
              backgroundColor: 'white',
            }}
          >
            <h2>Generate Invoices</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Period Start (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                value={generateStart}
                onChange={(e) => setGenerateStart(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Period End (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                value={generateEnd}
                onChange={(e) => setGenerateEnd(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>
        )}

        {selectedInvoice ? (
          <div>
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                padding: '0.5rem 1rem',
                marginBottom: '1rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ← Back to List
            </button>
            <div
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
              }}
            >
              <h2>Invoice {selectedInvoice.invoiceNumber}</h2>
              <div style={{ marginBottom: '1rem' }}>
                <p>
                  <strong>Business:</strong> {selectedInvoice.businessName} (
                  {selectedInvoice.businessEmail})
                </p>
                <p>
                  <strong>Period:</strong> {selectedInvoice.periodStart} to{' '}
                  {selectedInvoice.periodEnd}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      ...getStatusColor(selectedInvoice.status),
                      fontSize: '0.9rem',
                    }}
                  >
                    {selectedInvoice.status}
                  </span>
                </p>
                <p>
                  <strong>Due Date:</strong> {selectedInvoice.dueDate}
                </p>
                {selectedInvoice.issuedAt && (
                  <p>
                    <strong>Issued At:</strong>{' '}
                    {new Date(selectedInvoice.issuedAt).toLocaleString()}
                  </p>
                )}
                {selectedInvoice.paidAt && (
                  <p>
                    <strong>Paid At:</strong>{' '}
                    {new Date(selectedInvoice.paidAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p>
                  <strong>Subtotal:</strong> {selectedInvoice.subtotal.toFixed(2)} TND
                </p>
                {selectedInvoice.tax && (
                  <p>
                    <strong>Tax:</strong> {selectedInvoice.tax.toFixed(2)} TND
                  </p>
                )}
                <p>
                  <strong>Total:</strong> {selectedInvoice.total.toFixed(2)} TND
                </p>
              </div>
              <h3>Items</h3>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '1rem',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Pack
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Order Date
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Quantity
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '1rem' }}>{item.packName}</td>
                        <td style={{ padding: '1rem' }}>
                          {new Date(item.orderDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {item.unitPrice.toFixed(2)} TND
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {item.totalPrice.toFixed(2)} TND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {loading ? (
              <p>Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                }}
              >
                <p>No invoices found. Generate invoices for a period to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Invoice #
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Business
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Period
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Total
                      </th>
                      <th
                        style={{
                          padding: '1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        style={{
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                        }}
                        onClick={() => loadInvoiceDetail(invoice.id)}
                      >
                        <td style={{ padding: '1rem' }}>{invoice.invoiceNumber}</td>
                        <td style={{ padding: '1rem' }}>{invoice.businessName}</td>
                        <td style={{ padding: '1rem' }}>
                          {invoice.periodStart} to {invoice.periodEnd}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              ...getStatusColor(invoice.status),
                              fontSize: '0.9rem',
                            }}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {invoice.total.toFixed(2)} TND
                        </td>
                        <td style={{ padding: '1rem' }}>{invoice.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
