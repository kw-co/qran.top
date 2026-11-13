import { useEffect, useCallback } from 'react';

const BUILD_VER_STORAGE_KEY = 'qran_app_build_version';

export const useServiceWorkerUpdater = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const host = window.location.hostname;
        const isPreviewOrDev =
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host.endsWith('.run.app') ||
            host.endsWith('.googleusercontent.com');

        if (isPreviewOrDev) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                    .getRegistrations()
                    .then(registrations => {
                        registrations.forEach(reg => reg.unregister());
                    })
                    .catch(() => {});
            }
            return;
        }

        let swReg: ServiceWorkerRegistration | null = null;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('./service-worker.js', { scope: './', updateViaCache: 'none' })
                .then(reg => {
                    swReg = reg;
                    reg.update().catch(() => {});

                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }

                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        });
                    });
                })
                .catch(error => console.warn('Service Worker registration failed:', error));
        }

        /**
         * Sends 1 lightweight request to ./version.json when online:
         * - If offline or version matches stored version -> does nothing (runs from local cache).
         * - If remote version is newer -> shows 1 notification and updates UI cache while keeping Quran data & fonts intact.
         */
        let isChecking = false;
        const checkRemoteVersion = async () => {
            if (isChecking) return;
            if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

            isChecking = true;
            try {
                if (swReg) {
                    swReg.update().catch(() => {});
                }
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(`./version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!res.ok) return;

                const data = await res.json();
                const remoteVer = data?.v;
                if (!remoteVer) return;

                const localVer = localStorage.getItem(BUILD_VER_STORAGE_KEY);
                if (!localVer) {
                    localStorage.setItem(BUILD_VER_STORAGE_KEY, remoteVer);
                    return;
                }

                if (localVer !== remoteVer) {
                    // Dispatch a single toast notification and trigger the cache-preserving force reload
                    window.dispatchEvent(
                        new CustomEvent('app-toast', {
                            detail: {
                                message: 'تتوفر نسخة حديثة من البرنامج — جاري التحديث تلقائياً...',
                                type: 'info'
                            }
                        })
                    );
                    const win = window as any;
                    if (typeof win.__qranForceReload === 'function') {
                        setTimeout(() => {
                            win.__qranForceReload(remoteVer);
                        }, 600);
                    } else {
                        localStorage.setItem(BUILD_VER_STORAGE_KEY, remoteVer);
                        window.location.reload();
                    }
                }
            } catch {
                // Offline or slow network — silently continue running offline
            } finally {
                isChecking = false;
            }
        };

        checkRemoteVersion();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkRemoteVersion();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', checkRemoteVersion);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', checkRemoteVersion);
        };
    }, []);

    const handleUpdate = useCallback(() => {
        const win = window as any;
        if (typeof win.__qranForceReload === 'function') {
            win.__qranForceReload();
        } else {
            window.location.reload();
        }
    }, []);

    return { showUpdateNotification: false, handleUpdate };
};
