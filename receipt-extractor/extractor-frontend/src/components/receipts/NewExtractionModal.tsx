import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface NewExtractionModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  selectedFile: File | null;
  fileError: string | null;
  onClose: () => void;
  onFileChange: (files: FileList | null) => void;
  onDeselectFile: () => void;
  onSubmit: () => void;
}

export function NewExtractionModal({
  isOpen,
  isSubmitting,
  selectedFile,
  fileError,
  onClose,
  onFileChange,
  onDeselectFile,
  onSubmit,
}: NewExtractionModalProps) {
  return (
    <Dialog open={isOpen} onClose={(_, reason) => (reason === 'backdropClick' ? undefined : onClose())} fullWidth maxWidth="sm">
      <DialogTitle className="modal-title-row">
        <IconButton className="modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography component="span" className="modal-title-text">New Extraction</Typography>
      </DialogTitle>
      <DialogContent>
        {isSubmitting && (
          <Box className="submitting-state">
            <CircularProgress size={20} />
            <Typography variant="body2">Submitting receipt…</Typography>
          </Box>
        )}
        <Box
          className="dropzone"
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            event.preventDefault();
            onFileChange(event.dataTransfer.files);
          }}
        >
          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files)}
          />
          {!selectedFile ? (
            <label htmlFor="file-input" className="dropzone-content">
              <Typography className="dropzone-title">Drag and drop a receipt image</Typography>
              <Typography className="dropzone-subtitle">or click to browse your files</Typography>
              <Typography className="dropzone-hint">Only JPG and PNG files. Max 10 MB.</Typography>
            </label>
          ) : (
            <Box className="selected-file">
              <Box className="selected-file-info">
                <Typography component="strong">{selectedFile.name}</Typography>
                <Typography variant="caption">
                  {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                </Typography>
              </Box>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={onDeselectFile}
                disabled={isSubmitting}
              >
                Deselect
              </Button>
            </Box>
          )}
        </Box>
        {fileError && (
          <Typography className="field-error" variant="caption">
            {fileError}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!selectedFile || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Submitting…' : 'Extract'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
