import { Modal, Button } from '@/shared/ui';
import { useDeleteProduct } from '../hooks/useInventory';
import { getErrorMessage } from '@/shared/lib/errors';
import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export function DeleteProductModal({ product, isOpen, onClose }) {
  const deleteMutation = useDeleteProduct();
  const [error, setError] = useState('');

  if (!product) return null;

  async function handleDelete() {
    setError('');
    try {
      await deleteMutation.mutateAsync(product.id);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      size="md"
    >
      <div className="space-y-4 text-text min-w-0">
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-xl border border-danger/20 bg-danger/5">
          <div className="p-2 rounded-lg bg-danger/10 text-danger shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-medium text-text text-sm">
              Are you sure you want to delete this product?
            </p>
            <p className="text-muted leading-relaxed">
              You are about to remove <span className="font-medium text-text">"{product.name}"</span> (SKU: <span className="font-mono">{product.sku}</span>) from the active catalog.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="solid"
            pending={deleteMutation.isPending}
            onClick={handleDelete}
            className="gap-2 bg-danger hover:bg-danger/90 text-white"
          >
            <Trash2 size={14} /> Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
