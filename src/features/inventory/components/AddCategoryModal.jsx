import { useState } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { useCreateCategory } from '../hooks/useInventory';
import { getErrorMessage } from '@/shared/lib/errors';
import { FolderPlus, Check } from 'lucide-react';

export function AddCategoryModal({ storeId, storeName, isOpen, onClose, onSuccess }) {
  const createCategoryMutation = useCreateCategory();

  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleCreateCategory(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a category name.');
      return;
    }

    setError('');
    try {
      const created = await createCategoryMutation.mutateAsync({
        storeId,
        name: trimmedName,
        hsnCode: hsnCode.trim() || null,
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(created);
      }
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setHsnCode('');
        onClose();
      }, 700);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function handleClose() {
    setName('');
    setHsnCode('');
    setError('');
    setSuccess(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Custom Category"
      size="md"
    >
      <form onSubmit={handleCreateCategory} className="space-y-4 text-text min-w-0">
        {storeName && (
          <div className="text-xs text-muted flex items-center justify-between pb-1 border-b border-border">
            <span>Destination Store:</span>
            <span className="font-medium text-text">{storeName}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 font-medium flex items-center gap-2">
            <Check size={14} /> Category created and saved to database!
          </div>
        )}

        <Input
          id="custom-category-name"
          label="Category Name"
          placeholder="e.g. Ergonomic Office Chairs, Gaming Consoles..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Input
          id="custom-category-hsn"
          label="Default HSN / SAC Code (Optional)"
          placeholder="e.g. 9403, 8517, 8528"
          value={hsnCode}
          onChange={(e) => setHsnCode(e.target.value)}
        />

        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} className="px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            pending={createCategoryMutation.isPending}
            className="gap-2 px-4"
          >
            <FolderPlus size={15} /> Save Category
          </Button>
        </div>
      </form>
    </Modal>
  );
}
