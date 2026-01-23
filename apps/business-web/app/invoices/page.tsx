'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { InvoiceSummaryDto, InvoiceStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { FileText, ArrowRight } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getBusinessInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-success-50 text-success-700 border-success-300';
      case InvoiceStatus.ISSUED:
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case InvoiceStatus.DRAFT:
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
      default:
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-2 text-gray-600">View and manage your invoices</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={loadInvoices} />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading invoices..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && invoices.length === 0 && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No invoices found"
            description="Invoices will appear here once they are generated."
          />
        </div>
      )}

      {/* Invoices Grid */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="group block bg-surface border border-surface-dark rounded-lg p-6 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Invoice #{invoice.invoiceNumber}
                    </h3>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Period:</strong>{' '}
                  {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                  {new Date(invoice.periodEnd).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-surface-dark">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {invoice.total.toFixed(2)} TND
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
