/**
 * Utility functions
 */

/**
 * Format date string to readable format
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) {
    return isoString;
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Format status label
 */
export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    extracting: 'Extracting...',
    extracted: 'Done',
    failed: 'Failed',
    invalid: 'Invalid',
  };
  return labels[status] || status;
}


