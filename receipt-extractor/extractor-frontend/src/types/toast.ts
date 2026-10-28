/**
 * Toast/notification types
 */

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
}
