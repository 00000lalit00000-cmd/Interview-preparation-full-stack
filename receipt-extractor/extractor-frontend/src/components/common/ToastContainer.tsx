import { Alert, AlertColor, Button, Snackbar } from '@mui/material';
import type { Toast, ToastKind } from '../../types/toast';

interface ToastContainerProps {
  toasts: Toast[];
  onClose?: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  const mapKindToSeverity = (kind: ToastKind): AlertColor => {
    switch (kind) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={5000}
          onClose={() => onClose?.(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={mapKindToSeverity(toast.kind)}
            variant="filled"
            action={
              toast.actionLabel && toast.onAction ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    toast.onAction?.();
                    onClose?.(toast.id);
                  }}
                >
                  {toast.actionLabel}
                </Button>
              ) : undefined
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
