'use client';

import { useState, useEffect } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { CreateBusinessDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { StatusBadge } from '../../components/ui/status-badge';

export default function BusinessesPage() {
  const { businesses, loading, error, loadBusinesses, createBusiness, setError } = useBusinesses();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    email: '',
    phone: '',
    address: '',
    adminEmail: '',
  });

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const result = await createBusiness(formData);
      setShowCreateForm(false);
      setFormData({ name: '', email: '', phone: '', address: '', adminEmail: '' });
      // Show success message with credentials
      setError(`Business created! Admin: ${result.adminCredentials.email}, Password: ${result.adminCredentials.temporaryPassword} - Save these credentials securely.`);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

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

      <CollapsibleForm
        title="Create New Business"
        isOpen={showCreateForm}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreateForm(false);
          setFormData({ name: '', email: '', phone: '', address: '', adminEmail: '' });
        }}
        submitLabel="Create Business"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Phone">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>
          <FormField
            label="Admin Email"
            required
            helpText="A temporary password will be generated for this admin user"
          >
            <Input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
              placeholder="Email for the business admin user"
            />
          </FormField>
          <FormField label="Address" className="md:col-span-2">
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </FormField>
        </div>
      </CollapsibleForm>

      {loading ? (
        <Loading message="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <Empty
          message="No businesses found"
          description="Create your first business to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-surface border border-surface-dark rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                <StatusBadge status={business.status} />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {business.email}
                </p>
                {business.phone && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {business.phone}
                  </p>
                )}
                {business.address && (
                  <p className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="flex-1">{business.address}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
