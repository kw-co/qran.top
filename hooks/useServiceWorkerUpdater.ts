import { useEffect, useCallback } from 'react';

const BUILD_VER_STORAGE_KEY = 'qran_app_build_version';

export const useServiceWorkerUpdater = () => {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const host = window.location.hostname;
        const isPreviewOrDev =
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host.endsWith('.run.app') ||
            host.endsWith('.googleusercontent.com');

        if (isPreviewOrDev) {
            navigator.serviceWorker
                .getRegistrations()
                .then(registrations => {
                    registrations.forEach(reg => reg.unregister());
                })
                .catch(() => {});
            return;
        }

        let isReloading = false;
        const triggerSeamlessReload = () => {
            if (isReloading) return;
            isReloading = true;
            window.location.reload();
        };

        // Reload once when a newly installed Service Worker claims control
        const handleControllerChange = () => {
            triggerSeamlessReload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        let swReg: ServiceWorkerRegistration | null = null;

        // Register with updateViaCache: 'none' so installed mobile PWAs never use a stale HTTP-cached service-worker.js
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

        // 1-byte version.json check whenever the PWA starts or comes back to foreground
        const checkRemoteVersion = async () => {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
            try {
                if (swReg) {
                    swReg.update().catch(() => {});
                }
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);
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
                    localStorage.setItem(BUILD_VER_STORAGE_KEY, remoteVer);
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(
                            keys.map(k => (k.includes('static') ? caches.delete(k) : Promise.resolve()))
                        );
                    }
                    triggerSeamlessReload();
                }
            } catch {
                // Offline or slow network — silently continue with cached version
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
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', checkRemoteVersion);
        };
    }, []);

    const handleUpdate = useCallback(() => {
        window.location.reload();
    }, []);

    return { showUpdateNotification: false, handleUpdate };
};
