'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFoodComponents } from '../../hooks/useFoodComponents';
import { ComponentDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { ComponentModal } from '../../components/components/ComponentModal';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';

export default function ComponentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const componentIdFromUrl = searchParams.get('componentId');

  const {
    components,
    loading,
    error,
    loadComponents,
    deleteComponent,
    setError,
  } = useFoodComponents();
  const [modalComponentId, setModalComponentId] = useState<string | null | 'create'>(
    null,
  );
  const [deletingComponentId, setDeletingComponentId] =
    useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  useEffect(() => {
    if (componentIdFromUrl) {
      setModalComponentId(componentIdFromUrl);
    }
  }, [componentIdFromUrl]);

  const handleDeleteClick = (componentId: string) => {
    setDeletingComponentId(componentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingComponentId) return;
    try {
      setError('');
      await deleteComponent(deletingComponentId);
      setShowDeleteModal(false);
      setDeletingComponentId(null);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingComponentId(null);
  };

  const openViewEdit = (component: ComponentDto) => {
    setModalComponentId(component.id);
  };

  const openCreate = () => {
    setModalComponentId('create');
  };

  const closeModal = () => {
    setModalComponentId(null);
    if (componentIdFromUrl) {
      router.replace('/food-components');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Components"
        description="Manage food components and their variants. Click a row to edit."
        action={
          <Button onClick={openCreate}>+ New Component</Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading components..." />
        </div>
      ) : components.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No components found"
            description="Create your first component to get started."
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light border-b border-surface-dark text-sm font-semibold text-gray-700">
            <div className="col-span-6">Component</div>
            <div className="col-span-6 text-right">Actions</div>
          </div>

          {components.map((component) => (
            <div
              key={component.id}
              onClick={() => openViewEdit(component)}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-surface-dark last:border-b-0 cursor-pointer hover:bg-surface-light transition-colors"
            >
              <div className="col-span-6">
                <span className="font-medium text-gray-900">
                  {component.name}
                </span>
              </div>
              <div
                className="col-span-6 flex justify-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(component.id)}
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

      <ComponentModal
        open={modalComponentId !== null}
        onClose={closeModal}
        componentId={
          modalComponentId === 'create' ? null : modalComponentId
        }
        onSaved={loadComponents}
      />

      <Dialog open={showDeleteModal} onOpenChange={(o) => !o && handleDeleteCancel()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Component?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this component? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-6">
            {deletingComponentId &&
              components.find((c) => c.id === deletingComponentId) && (
                <>
                  Component &quot;
                  {components.find((c) => c.id === deletingComponentId)?.name}
                  &quot; will be permanently deleted along with all its variants.
                  If this component has been used in any orders, deletion will be
                  prevented to maintain data integrity.
                </>
              )}
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleDeleteCancel}
              disabled={!deletingComponentId}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={!deletingComponentId}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
