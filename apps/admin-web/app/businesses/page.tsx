'use client';

import { useState, useEffect } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { PageHeader } from '../../components/ui/page-header';
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
import { BusinessModal } from '../../components/business/BusinessModal';
import { formatDateTime } from '../../lib/date-utils';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function BusinessesPage() {
  const router = useRouter();
  const { 
    businesses, 
    loading, 
    error, 
    loadBusinesses, 
  } = useBusinesses();
  
  const [businessModalOpen, setBusinessModalOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Businesses"
        description="Manage businesses and their administrators"
      />

      {error && (
        <div className="mb-6">
          <Error message={error} onRetry={loadBusinesses} />
        </div>
      )}

      <div className="mb-6">
        <Button
          variant="primary"
          onClick={() => setBusinessModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Business
        </Button>
      </div>

      {loading ? (
        <Loading message="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <Empty
          message="No businesses found"
          description="Create your first business to get started."
        />
      ) : (
        <div className="mt-6 bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business) => (
                  <TableRow
                    key={business.id}
                    onClick={() => router.push(`/businesses/${business.id}`)}
                    className="cursor-pointer hover:bg-surface-light transition-colors"
                  >
                    <TableCell className="whitespace-nowrap">
                      {business.logoUrl ? (
                        <img
                          src={`${API_BASE_URL}${business.logoUrl}`}
                          alt={business.name}
                          className="h-12 w-12 object-contain rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-surface-light rounded flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {business.name}
                      </div>
                      {business.legalName && (
                        <div className="text-xs text-gray-500 mt-1">
                          {business.legalName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-600">{business.email}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-600">{business.phone || '-'}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {business.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={business.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatDateTime(business.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Business Modal for creating new businesses */}
      <BusinessModal
        open={businessModalOpen}
        onClose={() => setBusinessModalOpen(false)}
        businessId={null}
        onSaved={() => {
          loadBusinesses();
          setBusinessModalOpen(false);
        }}
      />
    </div>
  );
}
