import { prefetchPageVersesV4Silent } from '../services/quranApiV4';

export const MUSHAF_FONTS_VERSION = 'v1';
export const TOTAL_PAGES = 604;
export const CACHE_NAME = 'quran-mushaf-fonts-v1';
const TRICKLE_CURSOR_KEY = 'qran_mushaf_trickle_cursor_v2';
const TRICKLE_COMPLETE_KEY = 'qran_mushaf_trickle_complete_v2';

// Primary reliable CDN URLs for King Fahd Complex v1 WOFF2 page fonts
export const getPrimaryFontUrl = (pageNum: number) =>
    `https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${pageNum}.woff2`;

export const getFallbackFontUrls = (pageNum: number) => [
    `https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${pageNum}.woff2`,
    `https://fonts.quran.com/quran/hafs/v1/woff2/p${pageNum}.woff2`
];

export const getFontUrl = (pageNum: number) => getPrimaryFontUrl(pageNum);

let isStyleInjected = false;
const loadedFontFaces = new Set<number>();
const inFlightFontPromises = new Map<number, Promise<boolean>>();

export function injectMushafFontFaces() {
    if (isStyleInjected) return;
    const styleId = 'mushaf-fonts-style';
    if (document.getElementById(styleId)) {
        isStyleInjected = true;
        return;
    }
    let css = '';
    for (let i = 1; i <= TOTAL_PAGES; i++) {
        css += `
@font-face {
  font-family: 'p${i}';
  src: url('https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${i}.woff2') format('woff2'),
       url('https://fonts.quran.com/quran/hafs/v1/woff2/p${i}.woff2') format('woff2');
  font-display: swap;
}
.font-p${i} { font-family: 'p${i}', 'QCF_P${String(i).padStart(3, '0')}', 'Amiri Quran', 'UthmanicHafs', serif; }
`;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
    isStyleInjected = true;
}

/**
 * Fetches or reads a single page's WOFF2 font from CacheStorage, caches it permanently for offline use,
 * and optionally registers it directly in document.fonts so it works 100% offline.
 */
export async function cacheSingleMushafPageFont(pageNum: number, registerInDocument = false): Promise<boolean> {
    if (pageNum < 1 || pageNum > TOTAL_PAGES) return false;
    if (registerInDocument && loadedFontFaces.has(pageNum)) return true;

    const existingPromise = inFlightFontPromises.get(pageNum);
    if (existingPromise && !registerInDocument) return existingPromise;

    const task = (async (): Promise<boolean> => {
        try {
            const hasCacheApi = typeof caches !== 'undefined';
            const cache = hasCacheApi ? await caches.open(CACHE_NAME) : null;
            const urls = getFallbackFontUrls(pageNum);

            let fontResponse: Response | undefined;

            if (cache) {
                for (const url of urls) {
                    const matched = await cache.match(url);
                    if (matched && matched.ok) {
                        const ct = matched.headers.get('content-type') || '';
                        if (!ct.includes('text/html')) {
                            fontResponse = matched;
                            break;
                        }
                    }
                }
                if (!fontResponse) {
                    const legacyMatch = await cache.match(`./fonts/mushaf/p${pageNum}.woff2`);
                    if (legacyMatch && legacyMatch.ok) {
                        const ct = legacyMatch.headers.get('content-type') || '';
                        if (!ct.includes('text/html')) {
                            fontResponse = legacyMatch;
                        }
                    }
                }
            }

            // Fetch from network if not found in CacheStorage
            if (!fontResponse) {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    return false;
                }
                for (const url of urls) {
                    try {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 6000);
                        const res = await fetch(url, { signal: controller.signal });
                        clearTimeout(timer);
                        if (res.ok) {
                            const ct = res.headers.get('content-type') || '';
                            if (!ct.includes('text/html')) {
                                if (cache) {
                                    await cache.put(urls[0], res.clone());
                                }
                                fontResponse = res;
                                break;
                            }
                        }
                    } catch {
                        // Try next fallback mirror
                    }
                }
            }

            if (!fontResponse) return false;

            if (registerInDocument && typeof FontFace !== 'undefined' && 'fonts' in document) {
                const buffer = await fontResponse.clone().arrayBuffer();
                if (buffer.byteLength > 100) {
                    const fontFace = new FontFace(`p${pageNum}`, buffer);
                    const loadedFace = await fontFace.load();
                    (document as any).fonts.add(loadedFace);
                    loadedFontFaces.add(pageNum);
                    return true;
                }
                return false;
            }

            return true;
        } catch {
            return false;
        } finally {
            inFlightFontPromises.delete(pageNum);
        }
    })();

    inFlightFontPromises.set(pageNum, task);
    return task;
}

/**
 * Ensures a specific page font is loaded into browser memory from CacheStorage or network before rendering.
 */
export async function ensurePageFontLoaded(pageNum: number): Promise<boolean> {
    injectMushafFontFaces();
    if (loadedFontFaces.has(pageNum)) return true;

    const loadedFromCacheOrNet = await cacheSingleMushafPageFont(pageNum, true);
    if (loadedFromCacheOrNet) return true;

    if (!('fonts' in document)) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

    try {
        await (document as any).fonts.load(`16px p${pageNum}`);
        loadedFontFaces.add(pageNum);
        return true;
    } catch {
        return false;
    }
}

/**
 * Preloads adjacent page fonts and verse layouts (previous and next pages) in the background
 * so that turning pages is instantaneous with zero rendering lag.
 */
export function preloadAdjacentPageFonts(currentPage: number) {
    const pagesToPreload = [
        currentPage + 1,
        currentPage - 1,
        currentPage + 2,
        currentPage - 2
    ].filter(p => p >= 1 && p <= TOTAL_PAGES);

    for (const page of pagesToPreload) {
        cacheSingleMushafPageFont(page, true).catch(() => {});
        prefetchPageVersesV4Silent(page).catch(() => {});
    }
}

let isTrickleRunning = false;

/**
 * Silent Background Trickle Engine:
 * Quietly caches Madinah Mushaf page fonts (1..604) and page layouts in small low-priority batches
 * during browser idle time without interrupting the user or slowing down the app.
 */
export function startSilentTrickleDownloadMushaf(
    onProgressUpdate?: (cachedCount: number, isComplete: boolean) => void
): () => void {
    if (isTrickleRunning || typeof window === 'undefined') {
        return () => {};
    }

    let cancelled = false;
    isTrickleRunning = true;

    const scheduleIdle = (cb: () => void, delayMs = 2200) => {
        setTimeout(() => {
            if (cancelled) return;
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(cb, { timeout: 3000 });
            } else {
                cb();
            }
        }, delayMs);
    };

    const runStep = async () => {
        if (cancelled) return;

        // If already marked complete, verify quickly and exit
        try {
            if (localStorage.getItem(TRICKLE_COMPLETE_KEY) === 'true') {
                const fullyCached = await checkMushafFontsDownloaded();
                if (fullyCached) {
                    onProgressUpdate?.(TOTAL_PAGES, true);
                    isTrickleRunning = false;
                    return;
                }
            }
        } catch {}

        // Pause quietly when offline; resume when back online
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            scheduleIdle(runStep, 5000);
            return;
        }

        let cursor = 1;
        try {
            const savedCursor = parseInt(localStorage.getItem(TRICKLE_CURSOR_KEY) || '1', 10);
            if (!isNaN(savedCursor) && savedCursor >= 1 && savedCursor <= TOTAL_PAGES) {
                cursor = savedCursor;
            }
        } catch {}

        const BATCH_SIZE = 3;
        const batchPages: number[] = [];
        for (let i = 0; i < BATCH_SIZE && cursor + i <= TOTAL_PAGES; i++) {
            batchPages.push(cursor + i);
        }

        await Promise.allSettled(
            batchPages.map(async (p) => {
                await cacheSingleMushafPageFont(p, false);
                await prefetchPageVersesV4Silent(p);
            })
        );

        const nextCursor = cursor + BATCH_SIZE;
        if (nextCursor > TOTAL_PAGES) {
            try {
                localStorage.setItem(TRICKLE_CURSOR_KEY, '1');
                localStorage.setItem(TRICKLE_COMPLETE_KEY, 'true');
            } catch {}
            onProgressUpdate?.(TOTAL_PAGES, true);
            isTrickleRunning = false;
            return;
        }

        try {
            localStorage.setItem(TRICKLE_CURSOR_KEY, String(nextCursor));
        } catch {}

        onProgressUpdate?.(Math.min(TOTAL_PAGES, nextCursor - 1), false);
        scheduleIdle(runStep, 2200);
    };

    // Start gently 4.5 seconds after app boot so initial interaction is 100% uncontended
    scheduleIdle(runStep, 4500);

    return () => {
        cancelled = true;
        isTrickleRunning = false;
    };
}

/**
 * Downloads all 604 mushaf page fonts into CacheStorage immediately (when user explicitly requests full fast download in Settings).
 */
export async function downloadAllMushafFonts(
    onProgress: (progress: number) => void,
    signal?: AbortSignal
): Promise<void> {
    const cache = await caches.open(CACHE_NAME);

    const missingPages: number[] = [];
    let downloadedCount = 0;

    for (let i = 1; i <= TOTAL_PAGES; i++) {
        const res =
            (await cache.match(getPrimaryFontUrl(i))) ||
            (await cache.match(`https://fonts.quran.com/quran/hafs/v1/woff2/p${i}.woff2`));
        if (res && !(res.headers.get('content-type') || '').includes('text/html')) {
            downloadedCount++;
        } else {
            missingPages.push(i);
        }
    }

    onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));

    if (missingPages.length === 0) {
        try {
            localStorage.setItem(TRICKLE_COMPLETE_KEY, 'true');
        } catch {}
        return;
    }

    const BATCH_SIZE = 25;
    for (let i = 0; i < missingPages.length; i += BATCH_SIZE) {
        if (signal?.aborted) {
            throw new Error('Download cancelled');
        }

        const batch = missingPages.slice(i, i + BATCH_SIZE);
        const fetchPromises = batch.map(async (pageNum) => {
            if (signal?.aborted) return;
            const ok = await cacheSingleMushafPageFont(pageNum, false);
            await prefetchPageVersesV4Silent(pageNum);
            if (ok) {
                downloadedCount++;
                onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));
            }
        });

        await Promise.allSettled(fetchPromises);
    }

    if (downloadedCount >= 580) {
        try {
            localStorage.setItem(TRICKLE_COMPLETE_KEY, 'true');
        } catch {}
        onProgress(100);
        return;
    }
    if (!signal?.aborted) {
        throw new Error('بعض الخطوط لم تكتمل، يرجى المحاولة مرة أخرى.');
    }
}

export async function checkMushafFontsDownloaded(): Promise<boolean> {
    try {
        if (localStorage.getItem(TRICKLE_COMPLETE_KEY) === 'true') {
            return true;
        }
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        return keys.length >= 580;
    } catch {
        return false;
    }
}

export async function getMushafCachedPagesCount(): Promise<number> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        return Math.min(TOTAL_PAGES, keys.length);
    } catch {
        return 0;
    }
}

export async function deleteMushafFonts(): Promise<boolean> {
    try {
        localStorage.removeItem(TRICKLE_CURSOR_KEY);
        localStorage.removeItem(TRICKLE_COMPLETE_KEY);
        loadedFontFaces.clear();
        return await caches.delete(CACHE_NAME);
    } catch {
        return false;
    }
}


