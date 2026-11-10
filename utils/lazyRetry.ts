import React from 'react';

/**
 * Robust lazy loading wrapper that retries dynamic module imports if they fail
 * due to temporary network issues, service worker updates, or Vite module reloads.
 */
export function lazyRetry<T extends React.ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
    retriesLeft = 3,
    interval = 800
): React.LazyExoticComponent<T> {
    return React.lazy(() =>
        new Promise<{ default: T }>((resolve, reject) => {
            const attempt = (remaining: number) => {
                componentImport()
                    .then(resolve)
                    .catch((error) => {
                        if (remaining <= 0) {
                            try {
                                const reloadKey = 'qran_chunk_reload_attempted';
                                if (!sessionStorage.getItem(reloadKey)) {
                                    sessionStorage.setItem(reloadKey, 'true');
                                    window.location.reload();
                                    return;
                                }
                            } catch {}
                            reject(error);
                            return;
                        }
                        setTimeout(() => {
                            attempt(remaining - 1);
                        }, interval);
                    });
            };
            attempt(retriesLeft);
        })
    );
}
