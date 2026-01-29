'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { ServiceDto } from '@contracts/core';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { ServiceModal } from '../../components/services/ServiceModal';
import { Settings, CheckCircle2, XCircle, Globe, EyeOff, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceIdFromUrl = searchParams.get('serviceId');

  const { services, loading, error, loadServices, deleteService, setError } = useServices();
  const [modalServiceId, setModalServiceId] = useState<string | null | 'create'>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (serviceIdFromUrl) {
      setModalServiceId(serviceIdFromUrl);
    }
  }, [serviceIdFromUrl]);

  const openViewEdit = (service: ServiceDto) => {
    setModalServiceId(service.id);
  };

  const openCreate = () => {
    setModalServiceId('create');
  };

  const closeModal = () => {
    setModalServiceId(null);
    if (serviceIdFromUrl) {
      router.replace('/services');
    }
  };

  const handleDeleteClick = (serviceId: string) => {
    setDeletingServiceId(serviceId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingServiceId) return;

    try {
      setError('');
      await deleteService(deletingServiceId);
      setShowDeleteModal(false);
      setDeletingServiceId(null);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingServiceId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Services"
        description="Manage services and assign packs to them. Click a row to edit."
        action={<Button onClick={openCreate}>+ New Service</Button>}
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading services..." />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No services found"
            description="Create your first service to get started."
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light border-b border-surface-dark text-sm font-semibold text-gray-700">
            <div className="col-span-4">Service Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Order Times</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => openViewEdit(service)}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-surface-dark last:border-b-0 cursor-pointer hover:bg-surface-light transition-colors"
            >
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <Settings className={`h-4 w-4 ${service.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <span className="font-medium text-gray-900">{service.name}</span>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {service.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  {service.isPublished ? (
                    <Globe className="h-4 w-4 text-blue-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  {!service.isActive && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Inactive
                    </span>
                  )}
                  {!service.isPublished && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                      Unpublished
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-600">
                  <div>Start: {service.orderStartTime || '—'}</div>
                  <div>Cutoff: {service.cutoffTime || '—'}</div>
                </div>
              </div>
              <div
                className="col-span-4 flex justify-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(service.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        open={modalServiceId !== null}
        onClose={closeModal}
        serviceId={modalServiceId === 'create' ? null : modalServiceId}
        onSaved={loadServices}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Service?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingServiceId && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Service <strong>"{services.find(s => s.id === deletingServiceId)?.name}"</strong> will be permanently deleted.
                </p>
                <p className="text-sm text-gray-600">
                  This will also delete all associated service packs and business services. If this service has active business services, deletion will be prevented to maintain data integrity.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleDeleteCancel}
              disabled={!deletingServiceId}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={!deletingServiceId}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
