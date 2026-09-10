import { useState, useEffect, useMemo, useCallback } from 'react';
import { safeLocalStorage } from '../utils/storage';

const ROUTE_PERSIST_KEY = 'qran_last_route';

export const useRouting = () => {
    const getInitialPath = () => {
        const hash = window.location.hash;
        if (!hash || hash === '#/' || hash === '#') {
            const saved = safeLocalStorage.getItem(ROUTE_PERSIST_KEY);
            if (saved && saved !== '#/' && saved !== '#') {
                try {
                    // Seed root history entry before pushing saved route so Android Back button navigates back to Home instead of exiting app
                    window.history.replaceState({ root: true }, '', '#/');
                    window.history.pushState(null, '', saved);
                } catch (e) {
                    window.location.hash = saved;
                }
                return saved;
            }
        }
        return hash || '#/';
    };

    const [currentPath, setCurrentPath] = useState(getInitialPath);

    const handleHashChange = useCallback(() => {
        const hash = window.location.hash || '#/';
        setCurrentPath(hash);
        safeLocalStorage.setItem(ROUTE_PERSIST_KEY, hash);
    }, []);

    useEffect(() => {
        // Run hash change handler on mount to ensure we capture deep links too
        const initialHash = window.location.hash;
        if (initialHash && initialHash !== '#/' && initialHash !== '#') {
            safeLocalStorage.setItem(ROUTE_PERSIST_KEY, initialHash);
        }

        window.addEventListener('hashchange', handleHashChange, false);
        window.addEventListener('popstate', handleHashChange, false);
        return () => {
            window.removeEventListener('hashchange', handleHashChange, false);
            window.removeEventListener('popstate', handleHashChange, false);
        };
    }, [handleHashChange]);

    const { path, pathParts, queryParams } = useMemo(() => {
        const [pathStr, paramsStr] = currentPath.substring(1).split('?');
        const parts = pathStr.split('/').filter(Boolean);
        const params = new URLSearchParams(paramsStr);
        return { path: pathStr, pathParts: parts, queryParams: params };
    }, [currentPath]);

    return {
        currentPath,
        pathParts,
        queryParams,
    };
};

