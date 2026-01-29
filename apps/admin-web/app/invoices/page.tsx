'use client';

import { useState, useEffect } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { useBusinesses } from '../../hooks/useBusinesses';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { DateInput } from '../../components/ui/date-input';
import { StatusBadge } from '../../components/ui/status-badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { ArrowLeft } from 'lucide-react';

export default function InvoicesPage() {
  const {
    invoices,
    selectedInvoice,
    loading,
    error,
    loadInvoices,
    loadInvoiceDetail,
    generateInvoices,
    generateBusinessInvoices,
    setSelectedInvoice,
    setError,
  } = useInvoices();
  const { businesses, loadBusinesses } = useBusinesses();
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateStart, setGenerateStart] = useState('');
  const [generateEnd, setGenerateEnd] = useState('');
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [businessStart, setBusinessStart] = useState('');
  const [businessEnd, setBusinessEnd] = useState('');

  useEffect(() => {
    loadInvoices();
    loadBusinesses();
  }, [loadInvoices, loadBusinesses]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateStart || !generateEnd) {
      setError('Please provide both start and end dates');
      return;
    }

    try {
      setError('');
      await generateInvoices(generateStart, generateEnd);
      setShowGenerateForm(false);
      setGenerateStart('');
      setGenerateEnd('');
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleGenerateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) {
      setError('Please select a business');
      return;
    }

    // If both dates are provided, validate they're both set
    if ((businessStart && !businessEnd) || (!businessStart && businessEnd)) {
      setError('Please provide both start and end dates, or leave both empty');
      return;
    }

    try {
      setError('');
      await generateBusinessInvoices(
        selectedBusinessId,
        businessStart || undefined,
        businessEnd || undefined,
      );
      setShowBusinessForm(false);
      setSelectedBusinessId('');
      setBusinessStart('');
      setBusinessEnd('');
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Invoices"
        description="Manage business invoices"
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      <div className="space-y-4 mb-6">
        <CollapsibleForm
          title="Generate Invoices"
          isOpen={showGenerateForm}
          onToggle={() => setShowGenerateForm(!showGenerateForm)}
          onSubmit={handleGenerate}
          onCancel={() => {
            setShowGenerateForm(false);
            setGenerateStart('');
            setGenerateEnd('');
          }}
          submitLabel={loading ? 'Generating...' : 'Generate'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Period Start" required>
              <DateInput
                value={generateStart}
                onChange={(e) => setGenerateStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Period End" required>
              <DateInput
                value={generateEnd}
                onChange={(e) => setGenerateEnd(e.target.value)}
                required
              />
            </FormField>
          </div>
        </CollapsibleForm>

        <CollapsibleForm
          title="Generate Invoice for Business"
          isOpen={showBusinessForm}
          onToggle={() => setShowBusinessForm(!showBusinessForm)}
          onSubmit={handleGenerateBusiness}
          onCancel={() => {
            setShowBusinessForm(false);
            setSelectedBusinessId('');
            setBusinessStart('');
            setBusinessEnd('');
          }}
          submitLabel={loading ? 'Generating...' : 'Generate'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Business" required>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background border-surface-dark"
                required
              >
                <option value="">Select a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Period Start (optional)" helpText="Leave empty to include all uninvoiced orders">
              <DateInput
                value={businessStart}
                onChange={(e) => setBusinessStart(e.target.value)}
              />
            </FormField>
            <FormField label="Period End (optional)" helpText="Leave empty to include all uninvoiced orders">
              <DateInput
                value={businessEnd}
                onChange={(e) => setBusinessEnd(e.target.value)}
              />
            </FormField>
          </div>
        </CollapsibleForm>
      </div>

      {selectedInvoice ? (
        <div>
          <Button
            variant="secondary"
            onClick={() => setSelectedInvoice(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Invoice {selectedInvoice.invoiceNumber}</h2>
            <div className="space-y-2 mb-6">
              <p className="font-normal"><strong>Business:</strong> {selectedInvoice.businessName} ({selectedInvoice.businessEmail})</p>
              {selectedInvoice.serviceName && (
                <p className="font-normal"><strong>Service:</strong> {selectedInvoice.serviceName}</p>
              )}
              <p className="font-normal"><strong>Period:</strong> {selectedInvoice.periodStart} to {selectedInvoice.periodEnd}</p>
              <p className="font-normal">
                <strong>Status:</strong>{' '}
                <StatusBadge status={selectedInvoice.status} />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pack</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900">{item.packName}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">{new Date(item.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)} TND</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-900 text-right">{item.totalPrice.toFixed(2)} TND</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        onClick={() => loadInvoiceDetail(invoice.id)}
                        className="cursor-pointer"
                      >
                        <TableCell className="whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-900">{invoice.businessName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-600">
                          {invoice.serviceName || <span className="text-gray-400 italic">No service</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {invoice.periodStart} to {invoice.periodEnd}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-900 text-right">{invoice.total.toFixed(2)} TND</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">{invoice.dueDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
