import { Box, Button, Dialog, DialogActions, DialogContent, Typography, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ReceiptDetail } from '../../types/receipt';
import { formatDateTime, formatStatusLabel } from '../../utils/formatters';
import { receiptClient } from '../../api/receipt';

interface ReceiptDetailsModalProps {
  receipt: ReceiptDetail;
  isLoading: boolean;
  onClose: () => void;
  onRequestDelete: (receipt: ReceiptDetail) => void;
}

export function ReceiptDetailsModal({
  receipt,
  isLoading,
  onClose,
  onRequestDelete,
}: ReceiptDetailsModalProps) {
  const rawDetails = receipt.details as unknown as {
    currency?: string;
    currencyCode?: string;
    items?: Array<Record<string, unknown>>;
    lineItems?: Array<Record<string, unknown>>;
    line_items?: Array<Record<string, unknown>>;
  } | null;
  
  const currency = rawDetails?.currency ?? rawDetails?.currencyCode ?? 'USD';
  const rawItems =
    rawDetails?.items ??
    rawDetails?.lineItems ??
    rawDetails?.line_items ??
    ((receipt as unknown as { items?: Array<Record<string, unknown>> }).items ?? []);

  const items = (rawItems || [])
    .map((item) => {
      const name =
        (item?.name as string) ??
        (item?.description as string) ??
        (item?.itemName as string) ??
        (item?.text as string) ??
        'Item';
      const amount =
        (item?.amount as number) ??
        (item?.price as number) ??
        (item?.total as number) ??
        (item?.value as number) ??
        0;
      return { name, amount };
    })
    .filter((item) => item.name || Number.isFinite(item.amount));

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogContent className="details-modal">
        <Box className="details-topbar">
          <Box className="details-topbar-left">
            <IconButton aria-label="Back" onClick={onClose} className="details-back">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography className="details-title">{receipt.originalName}</Typography>
          </Box>
          <Box className="details-topbar-right">
            <Typography className="details-status-label">Status:</Typography>
            <Chip
              size="small"
              label={formatStatusLabel(receipt.status)}
              className={`status-pill status-${receipt.status}`}
            />
          </Box>
        </Box>

        <Box className="details-meta">
          Submitted {formatDateTime(receipt.createdAt)}
        </Box>

        <Box className="details-content-grid">
          <Box className="details-image">
            <img
              src={receiptClient.getImageUrl(receipt.id)}
              alt={receipt.originalName}
            />
          </Box>
          <Box className="details-content">

            {isLoading ? (
              <Box className="centered-state">
                <Typography variant="body2">Loading details…</Typography>
              </Box>
            ) : receipt.status === 'extracting' ? (
              <Box className="details-message">
                <Typography variant="subtitle2">Extraction in progress</Typography>
                <Typography variant="body2">
                  We are currently extracting the details from this receipt. This may take a few
                  moments. You can close this window and we will update the status when it is
                  complete.
                </Typography>
              </Box>
            ) : receipt.status === 'failed' ? (
              <Box className="details-message error">
                <Typography variant="subtitle2">Extraction failed</Typography>
                <Typography variant="body2">
                  {receipt.failureReason ||
                    'An unexpected error occurred while extracting this receipt.'}
                </Typography>
              </Box>
            ) : receipt.status === 'invalid' ? (
              <Box className="details-message warning">
                <Typography variant="subtitle2">Invalid receipt</Typography>
                <Typography variant="body2">
                  {receipt.failureReason ||
                    'The provided image was not recognized as a valid receipt.'}
                </Typography>
              </Box>
            ) : receipt.details ? (
              <Box className="details-single-col">
                <Typography variant="h6" className="details-vendor-name">
                  {receipt.details.vendorName}
                </Typography>
                <Typography className="details-field">{receipt.details.date}</Typography>
                <Typography className="details-field">{receipt.details.currency}</Typography>

                <Box className="details-divider" />

                <Box className="details-items-scroll">
                  {items.length === 0 ? (
                    <Typography variant="caption" className="details-empty">
                      No items detected for this receipt.
                    </Typography>
                  ) : (
                    items.map((item, index) => (
                      <Box key={index} className="details-item-row">
                        <span className="details-item-name">{item.name}</span>
                        <span className="details-item-amount">
                          $ {Number(item.amount).toFixed(2)}
                        </span>
                      </Box>
                    ))
                  )}
                </Box>

                <Box className="details-divider" />

                <Box className="details-row">
                  <span>GST/Tax</span>
                  <span>$ {receipt.details.tax.toFixed(2)}</span>
                </Box>

                <Box className="details-divider details-divider-strong" />

                <Box className="details-row details-total">
                  <span>Total</span>
                  <span>$ {receipt.details.total.toFixed(2)}</span>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className="details-actions">
        <Button color="error" variant="outlined" onClick={() => onRequestDelete(receipt)}>
          Delete
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
