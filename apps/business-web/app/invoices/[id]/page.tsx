'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { InvoiceDto, InvoiceStatus } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { Empty } from '../../../components/ui/empty';
import { ArrowLeft, FileText } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
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
      setError('');
      const data = await apiClient.getInvoice(id);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToLoad'));
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
        <button
          onClick={() => router.push('/invoices')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('invoices.backToInvoices')}
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{t('invoices.invoiceDetails')}</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => params.id && loadInvoice(params.id as string)} />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message={t('invoices.loadingInvoice')} />
        </div>
      )}

      {/* Empty State */}
      {!loading && !invoice && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty message={t('invoices.invoiceNotFound')} />
        </div>
      )}

      {/* Invoice Details */}
      {!loading && invoice && (
        <div className="bg-surface border border-surface-dark rounded-lg p-6 lg:p-8">
          {/* Invoice Header */}
          <div className="mb-8 pb-6 border-b border-surface-dark">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t('invoices.invoiceNumber')} #{invoice.invoiceNumber}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{invoice.businessName}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">
                  <strong>{t('common.labels.businessEmail')}:</strong> {invoice.businessEmail}
                </p>
                <p className="text-gray-600 mb-1">
                  <strong>{t('common.labels.period')}:</strong>{' '}
                  {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                  {new Date(invoice.periodEnd).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <strong>{t('common.labels.dueDate')}:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                {invoice.issuedAt && (
                  <p className="text-gray-600 mb-1">
                    <strong>{t('common.labels.issuedAt')}:</strong> {new Date(invoice.issuedAt).toLocaleString()}
                  </p>
                )}
                {invoice.paidAt && (
                  <p className="text-gray-600">
                    <strong>{t('common.labels.paidAt')}:</strong> {new Date(invoice.paidAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.labels.items')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-dark border-b border-surface-dark">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('common.labels.orderDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('common.labels.pack')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('common.labels.quantity')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('common.labels.unitPrice')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('common.labels.total')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-light">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(item.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.packName}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.unitPrice.toFixed(2)} TND
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {item.totalPrice.toFixed(2)} TND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="pt-6 border-t-2 border-surface-dark">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('common.labels.subtotal')}:</span>
                  <span className="font-medium">{invoice.subtotal.toFixed(2)} TND</span>
                </div>
                {invoice.tax && invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('common.labels.tax')}:</span>
                    <span className="font-medium">{invoice.tax.toFixed(2)} TND</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-semibold text-gray-900 pt-2 border-t border-surface-dark">
                  <span>{t('common.labels.total')}:</span>
                  <span>{invoice.total.toFixed(2)} TND</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
