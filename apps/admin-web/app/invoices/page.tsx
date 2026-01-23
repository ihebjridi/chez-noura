'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  InvoiceSummaryDto,
  InvoiceDto,
  InvoiceStatus,
} from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { ArrowLeft } from 'lucide-react';

export default function InvoicesPage() {
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
        return 'bg-success-50 text-success-700';
      case InvoiceStatus.ISSUED:
        return 'bg-success-50 text-success-700';
      case InvoiceStatus.DRAFT:
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-800'; // Status color - keep as is
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">Manage business invoices</p>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {/* Inline Generate Form */}
      <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
        <button
          onClick={() => setShowGenerateForm(!showGenerateForm)}
          className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
        >
          <span className="font-semibold">Generate Invoices</span>
          <span className="text-gray-500">{showGenerateForm ? '−' : '+'}</span>
        </button>
        {showGenerateForm && (
          <div className="px-6 py-4 border-t border-surface-dark">
            <form onSubmit={handleGenerate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={generateStart}
                    onChange={(e) => setGenerateStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={generateEnd}
                    onChange={(e) => setGenerateEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateForm(false);
                    setGenerateStart('');
                    setGenerateEnd('');
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

      {selectedInvoice ? (
        <div>
          <button
            onClick={() => setSelectedInvoice(null)}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-secondary-400 text-white rounded-lg hover:bg-secondary-500 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Invoice {selectedInvoice.invoiceNumber}</h2>
            <div className="space-y-2 mb-6">
              <p className="font-normal"><strong>Business:</strong> {selectedInvoice.businessName} ({selectedInvoice.businessEmail})</p>
              <p className="font-normal"><strong>Period:</strong> {selectedInvoice.periodStart} to {selectedInvoice.periodEnd}</p>
              <p className="font-normal">
                <strong>Status:</strong>{' '}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </p>
              <p className="font-normal"><strong>Due Date:</strong> {selectedInvoice.dueDate}</p>
              {selectedInvoice.issuedAt && (
                <p className="font-normal"><strong>Issued At:</strong> {new Date(selectedInvoice.issuedAt).toLocaleString()}</p>
              )}
              {selectedInvoice.paidAt && (
                <p className="font-normal"><strong>Paid At:</strong> {new Date(selectedInvoice.paidAt).toLocaleString()}</p>
              )}
            </div>
            <div className="mb-6 space-y-1">
              <p className="font-normal"><strong>Subtotal:</strong> {selectedInvoice.subtotal.toFixed(2)} TND</p>
              {selectedInvoice.tax && (
                <p className="font-normal"><strong>Tax:</strong> {selectedInvoice.tax.toFixed(2)} TND</p>
              )}
              <p className="font-normal"><strong>Total:</strong> {selectedInvoice.total.toFixed(2)} TND</p>
            </div>
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-dark">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-light">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.packName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.orderDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)} TND</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.totalPrice.toFixed(2)} TND</td>
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
            <div className="bg-surface border border-surface-dark rounded-lg p-12">
              <Loading message="Loading invoices..." />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-surface border border-surface-dark rounded-lg p-12">
              <Empty
                message="No invoices found"
                description="Generate invoices for a period to get started."
              />
            </div>
          ) : (
            <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-dark">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-surface-dark">
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        onClick={() => loadInvoiceDetail(invoice.id)}
                        className="hover:bg-surface-light cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.businessName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.periodStart} to {invoice.periodEnd}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{invoice.total.toFixed(2)} TND</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
