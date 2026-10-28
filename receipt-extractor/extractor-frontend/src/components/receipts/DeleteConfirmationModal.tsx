import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Are you sure you want to permanently delete this record?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button color="error" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting' : 'Yes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

