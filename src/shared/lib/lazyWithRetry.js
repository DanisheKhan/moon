import { lazy } from 'react';

/**
 * Wraps dynamic imports with automatic retry logic.
 * Resilient against temporary server restarts, network blips, and stale cache during Vite dev or deployment.
 */
export function lazyWithRetry(componentImport, retries = 2, interval = 500) {
  return lazy(() =>
    new Promise((resolve, reject) => {
      function attempt(remaining) {
        componentImport()
          .then(resolve)
          .catch((error) => {
            const isImportError =
              error?.message?.includes('Failed to fetch dynamically imported module') ||
              error?.message?.includes('dynamically imported module') ||
              error?.message?.includes('Loading chunk') ||
              error?.name === 'TypeError';

            if (remaining > 0 && isImportError) {
              setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
            } else {
              reject(error);
            }
          });
      }

      attempt(retries);
    })
  );
}

