import { useCallback, useEffect, useRef, useState } from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import type { ReceiptSummary, ReceiptDetail } from '../../types/receipt';
import { useReceipts } from '../../hooks/useReceipts';
import { useUserId } from '../../hooks/useUserId';
import { STORAGE_KEYS } from '../../constants/config';
import { receiptClient } from '../../api/receipt';
import { ReceiptList } from './ReceiptList';
import { NewExtractionModal } from './NewExtractionModal';
import { ReceiptDetailsModal } from './ReceiptDetailsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ToastContainer } from '../common/ToastContainer';
import type { Toast } from '../../types/toast';

interface DeleteContext {
  receipt: ReceiptSummary | ReceiptDetail;
  fromDetails: boolean;
}

export function ReceiptsPage() {
  const userId = useUserId(STORAGE_KEYS.USER_ID);
  const {
    receipts,
    loading,
    error: apiError,
    uploadReceipt: apiUploadReceipt,
    deleteReceipt: apiDeleteReceipt,
    fetchReceipts,
  } = useReceipts(userId);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const statusByIdRef = useRef<Record<string, ReceiptSummary['status']>>({});

  const openNewModal = () => {
    resetNewModalState();
    setIsNewModalOpen(true);
  };

  const closeNewModal = () => {
    resetNewModalState();
    setIsNewModalOpen(false);
  };

  const resetNewModalState = () => {
    setSelectedFile(null);
    setFileError(null);
    setIsSubmitting(false);
  };

  const handleFileChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }
    const file = fileList[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setFileError('Invalid file type. Please select a JPG or PNG image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setFileError('File is too large. Maximum size is 10 MB.');
      return;
    }
    setSelectedFile(file);
    setFileError(null);
  };

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const nextId = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id: nextId }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleSubmitNewExtraction = async () => {
    if (!selectedFile || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const newReceipt = await apiUploadReceipt(selectedFile);
      // Track the new receipt so SSE events can detect the status transition
      statusByIdRef.current[newReceipt.id] = newReceipt.status;
      addToast({ kind: 'success', message: 'Receipt submitted. Extraction in progress.' });
      closeNewModal();
    } catch (err) {
      addToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unexpected error while submitting receipt.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadReceiptDetails = useCallback(async (id: string) => {
    setIsDetailsLoading(true);
    try {
      const data = await receiptClient.getReceipt(id);
      setSelectedReceipt(data.receipt);
    } catch (error) {
      addToast({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to load receipt details.',
      });
    } finally {
      setIsDetailsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // Gate that SSE messages wait on until the initial fetch completes
    let initDone = false;
    const pendingEvents: { receiptId: string; status: string }[] = [];

    const initStatuses = async () => {
      const initial = await fetchReceipts({ silent: true });
      const nextMap: Record<string, ReceiptSummary['status']> = {};
      initial.forEach((r) => {
        nextMap[r.id] = r.status;
      });
      // Merge rather than replace so uploads added after mount are kept
      statusByIdRef.current = { ...statusByIdRef.current, ...nextMap };
      initDone = true;

      // Drain any SSE events that arrived while we were fetching
      for (const evt of pendingEvents) {
        handleSseEvent(evt);
      }
      pendingEvents.length = 0;
    };

    const handleSseEvent = async (data: {
      receiptId: string;
      status: string;
    }) => {
      const prevStatus = statusByIdRef.current[data.receiptId];

      // Re-fetch the full list so the UI is in sync
      const updated = await fetchReceipts({ silent: true });
      const nextMap: Record<string, ReceiptSummary['status']> = {};
      updated.forEach((r) => {
        nextMap[r.id] = r.status;
      });
      statusByIdRef.current = { ...statusByIdRef.current, ...nextMap };

      // Show a toast when a receipt transitions from "extracting"
      if (
        prevStatus &&
        prevStatus === 'extracting' &&
        data.status !== prevStatus
      ) {
        let kind: Toast['kind'] = 'info';
        let message = 'Receipt extraction updated.';
        if (data.status === 'extracted') {
          kind = 'success';
          message = 'Receipt extraction completed successfully.';
        } else if (data.status === 'failed') {
          kind = 'error';
          message = 'Receipt extraction failed.';
        } else if (data.status === 'invalid') {
          kind = 'error';
          message = 'The uploaded image was not a valid receipt.';
        }

        addToast({
          kind,
          message,
          actionLabel: 'View',
          onAction: () => loadReceiptDetails(data.receiptId),
        });
      }
    };

    initStatuses();

    // Open an SSE connection for real-time extraction updates
    const eventsUrl = receiptClient.getEventsUrl(userId);
    const eventSource = new EventSource(eventsUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        receiptId: string;
        status: string;
      };

      if (!initDone) {
        // Queue events until the initial fetch completes
        pendingEvents.push(data);
        return;
      }

      handleSseEvent(data);
    };

    eventSource.onerror = () => {
      // EventSource will automatically reconnect on its own
    };

    return () => {
      eventSource.close();
    };
  }, [userId, addToast, fetchReceipts, loadReceiptDetails]);

  const handleDeleteRequest = (receipt: ReceiptSummary | ReceiptDetail, fromDetails: boolean) => {
    setDeleteContext({ receipt, fromDetails });
  };

  const confirmDelete = async () => {
    if (!deleteContext || isDeleting) return;
    setIsDeleting(true);
    try {
      const { receipt, fromDetails } = deleteContext;
      await apiDeleteReceipt(receipt.id);
      if (fromDetails) {
        setSelectedReceipt(null);
      }
      addToast({ kind: 'success', message: 'Receipt deleted.' });
      setDeleteContext(null);
    } catch (err) {
      addToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete receipt. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const extractionsTitle = 'My Extractions';

  return (
    <Box
      className="app-root"
      onClick={() => {
        if (menuOpenForId) {
          setMenuOpenForId(null);
          setMenuAnchorEl(null);
        }
      }}
    >
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar className="app-header">
          <Box>
            <Typography variant="h5" className="app-title">
              Receipt Extractor
            </Typography>
            <Typography variant="body2" className="app-subtitle">
              Upload receipts and track AI-powered extractions.
            </Typography>
          </Box>
          <Button variant="contained" color="primary" onClick={openNewModal}>
            New Extraction
          </Button>
        </Toolbar>
      </AppBar>

      <ReceiptList
        title={extractionsTitle}
        receipts={receipts}
        loading={loading}
        error={apiError?.message ?? null}
        menuOpenForId={menuOpenForId}
        menuAnchorEl={menuAnchorEl}
        onToggleMenu={(id, anchorEl) => {
          setMenuOpenForId((current) => (current === id ? null : id));
          setMenuAnchorEl(anchorEl);
        }}
        onNewExtractionClick={openNewModal}
        onSelectReceipt={(receipt) => loadReceiptDetails(receipt.id)}
        onRequestDelete={(receipt) => handleDeleteRequest(receipt, false)}
      />

      <NewExtractionModal
        isOpen={isNewModalOpen}
        isSubmitting={isSubmitting}
        selectedFile={selectedFile}
        fileError={fileError}
        onClose={closeNewModal}
        onFileChange={handleFileChange}
        onDeselectFile={() => setSelectedFile(null)}
        onSubmit={handleSubmitNewExtraction}
      />

      {selectedReceipt && (
        <ReceiptDetailsModal
          receipt={selectedReceipt}
          isLoading={isDetailsLoading}
          onClose={() => setSelectedReceipt(null)}
          onRequestDelete={(receipt) => handleDeleteRequest(receipt, true)}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteContext}
        isDeleting={isDeleting}
        onCancel={() => setDeleteContext(null)}
        onConfirm={confirmDelete}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Box>
  );
}
