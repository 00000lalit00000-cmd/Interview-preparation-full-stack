import { Avatar, Chip, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Menu, MenuItem, Paper, Typography, Button, Box } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { ReceiptSummary } from '../../types/receipt';
import { formatDateTime, formatStatusLabel } from '../../utils/formatters';
import { receiptClient } from '../../api/receipt';

interface ReceiptListProps {
  title: string;
  receipts: ReceiptSummary[];
  loading: boolean;
  error: string | null;
  menuOpenForId: string | null;
  menuAnchorEl: HTMLElement | null;
  onToggleMenu: (id: string, anchorEl: HTMLElement | null) => void;
  onNewExtractionClick: () => void;
  onSelectReceipt: (receipt: ReceiptSummary) => void;
  onRequestDelete: (receipt: ReceiptSummary) => void;
}

export function ReceiptList({
  title,
  receipts,
  loading,
  error,
  menuOpenForId,
  menuAnchorEl,
  onToggleMenu,
  onNewExtractionClick,
  onSelectReceipt,
  onRequestDelete,
}: ReceiptListProps) {
  const hasReceipts = receipts.length > 0;

  return (
    <main className="app-main">
      <Paper className="card" elevation={4}>
        <Box className="card-header">
          <Typography variant="h6">{title}</Typography>
        </Box>

        {loading ? (
          <Box className="centered-state">
            <CircularProgress size={24} />
            <Typography variant="body2">Loading your extractions…</Typography>
          </Box>
        ) : error ? (
          <Box className="centered-state error">
            <Typography variant="body2">{error}</Typography>
          </Box>
        ) : !hasReceipts ? (
          <Box className="empty-state">
            <Box className="empty-illustration">🧾</Box>
            <Typography variant="h6">No extractions yet</Typography>
            <Typography variant="body2">
              Upload a receipt to get started. Your previous extractions will appear here.
            </Typography>
            <Button variant="outlined" color="inherit" onClick={onNewExtractionClick}>
              New Extraction
            </Button>
          </Box>
        ) : (
          <List className="receipt-list" aria-label="Receipt Extractions">
            {receipts.map((receipt) => (
              <ListItem
                key={receipt.id}
                className="receipt-list-item"
                onClick={() => onSelectReceipt(receipt)}
              >
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    className="receipt-thumbnail"
                    src={receiptClient.getImageUrl(receipt.id)}
                    alt={receipt.originalName}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" className="receipt-name">
                      {receipt.originalName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" className="receipt-subtext">
                      Submitted {formatDateTime(receipt.createdAt)}
                    </Typography>
                  }
                />
                <Chip
                  size="small"
                  label={formatStatusLabel(receipt.status)}
                  className={`status-pill status-${receipt.status}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="more actions"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleMenu(receipt.id, event.currentTarget);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    open={menuOpenForId === receipt.id}
                    anchorEl={menuAnchorEl}
                    onClose={() => onToggleMenu(receipt.id, null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        onRequestDelete(receipt);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </main>
  );
}
