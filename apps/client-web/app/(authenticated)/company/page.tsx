'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { BusinessDto } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { Building2, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

export default function CompanyPage() {
  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      setError('');
      const businessData = await apiClient.getMyBusiness();
      setBusiness(businessData);
    } catch (err: any) {
      setError(err.message || 'Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message="Loading company information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Error message={error} />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-4">
        <Error message="Company information not available" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Company</h1>
        <p className="text-sm text-gray-600 mt-1">
          Your affiliated company information
        </p>
      </div>

      <div className="bg-surface border border-surface-dark rounded-lg p-6 space-y-6">
        {/* Company Name */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
          </div>
          {business.legalName && business.legalName !== business.name && (
            <p className="text-sm text-gray-600 ml-8">{business.legalName}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded text-xs font-semibold ${
            business.status === 'ACTIVE'
              ? 'bg-success-50 text-success-700 border border-success-300'
              : business.status === 'INACTIVE'
              ? 'bg-gray-50 text-gray-700 border border-gray-300'
              : 'bg-warning-50 text-warning-700 border border-warning-300'
          }`}>
            {business.status === 'ACTIVE' && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {business.status}
              </span>
            )}
            {business.status !== 'ACTIVE' && business.status}
          </span>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 pt-4 border-t border-surface-dark">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Contact Information
          </h3>

          {business.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 mb-1">Email</p>
                <a
                  href={`mailto:${business.email}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {business.email}
                </a>
              </div>
            </div>
          )}

          {business.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 mb-1">Phone</p>
                <a
                  href={`tel:${business.phone}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {business.phone}
                </a>
              </div>
            </div>
          )}

          {business.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 mb-1">Address</p>
                <p className="text-sm text-gray-900">{business.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-surface-dark">
          <p className="text-xs text-gray-500">
            Company ID: {business.id}
          </p>
        </div>
      </div>
    </div>
  );
}
