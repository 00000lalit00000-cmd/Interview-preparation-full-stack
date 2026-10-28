import { useState } from 'react';

/**
 * Hook for managing user ID in local storage
 */
export function useUserId(storageKey: string) {
  const [userId] = useState<string>(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    const id = crypto.randomUUID();
    window.localStorage.setItem(storageKey, id);
    return id;
  });

  return userId;
}
