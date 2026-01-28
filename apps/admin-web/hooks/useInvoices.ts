'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { InvoiceSummaryDto, InvoiceDto } from '@contracts/core';

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoices = useCallback(async () => {
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
  }, []);

  const loadInvoiceDetail = useCallback(async (id: string) => {
    try {
      setError('');
      const data = await apiClient.getInvoiceById(id);
      setSelectedInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice details');
      throw err;
    }
  }, []);

  const generateInvoices = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError('');
      await apiClient.generateInvoices(startDate, endDate);
      await loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  const generateBusinessInvoices = useCallback(async (businessId: string, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError('');
      await apiClient.generateBusinessInvoices(businessId, startDate, endDate);
      await loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to generate business invoices');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

  return {
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
  };
}
