import { SHAMARLY_TOTAL_PAGES } from '../data/shamarlyIndex';

export const SHAMARLY_CACHE_NAME = 'quran-mushaf-shamarly-v1';

export function formatShamarlyPageNumber(page: number): string {
    return String(page).padStart(3, '0');
}

/**
 * Primary high-speed global CDN for Shamarly pages
 */
export function getShamarlyPageUrl(pageNumber: number): string {
    const safePage = Math.min(Math.max(1, pageNumber), SHAMARLY_TOTAL_PAGES);
    const formatted = formatShamarlyPageNumber(safePage);
    return `https://cdn.jsdelivr.net/gh/Mr-DDDAlKilanny/shamraly-images@master/${formatted}.png`;
}

/**
 * Fallback direct GitHub raw URL
 */
export function getShamarlyFallbackUrl(pageNumber: number): string {
    const safePage = Math.min(Math.max(1, pageNumber), SHAMARLY_TOTAL_PAGES);
    const formatted = formatShamarlyPageNumber(safePage);
    return `https://raw.githubusercontent.com/Mr-DDDAlKilanny/shamraly-images/master/${formatted}.png`;
}

/**
 * Check how many pages of Shamarly Mushaf are cached locally.
 */
export async function checkShamarlyDownloaded(): Promise<{ isDownloaded: boolean; cachedCount: number; percentage: number }> {
    if (!('caches' in window)) {
        return { isDownloaded: false, cachedCount: 0, percentage: 0 };
    }

    try {
        const cache = await caches.open(SHAMARLY_CACHE_NAME);
        const keys = await cache.keys();
        const cachedCount = keys.length;
        const percentage = Math.min(100, Math.round((cachedCount / SHAMARLY_TOTAL_PAGES) * 100));
        // Consider fully downloaded if at least 520 pages exist
        const isDownloaded = cachedCount >= SHAMARLY_TOTAL_PAGES - 2;
        return { isDownloaded, cachedCount, percentage };
    } catch (e) {
        console.warn('Error checking Shamarly cache:', e);
        return { isDownloaded: false, cachedCount: 0, percentage: 0 };
    }
}

/**
 * Preload adjacent pages for seamless, instantaneous page flipping.
 */
export function preloadAdjacentShamarlyPages(currentPage: number): void {
    const adjacent = [
        currentPage + 1,
        currentPage - 1,
        currentPage + 2,
        currentPage - 2
    ].filter(p => p >= 1 && p <= SHAMARLY_TOTAL_PAGES);

    for (const page of adjacent) {
        const img = new Image();
        img.src = getShamarlyPageUrl(page);
    }
}

/**
 * Download all 522 Shamarly pages into CacheStorage in managed concurrency chunks.
 */
export async function downloadAllShamarlyPages(
    onProgress: (progress: number, downloadedCount: number, total: number) => void,
    signal?: AbortSignal
): Promise<void> {
    if (!('caches' in window)) {
        throw new Error('متصفحك لا يدعم التخزين المؤقت للبيانات');
    }

    const cache = await caches.open(SHAMARLY_CACHE_NAME);

    // 1. Identify already cached pages
    const keys = await cache.keys();
    const cachedUrls = new Set(keys.map(k => k.url));

    const pagesToDownload: number[] = [];
    for (let p = 1; p <= SHAMARLY_TOTAL_PAGES; p++) {
        const url = getShamarlyPageUrl(p);
        const fallback = getShamarlyFallbackUrl(p);
        if (!cachedUrls.has(url) && !cachedUrls.has(fallback)) {
            pagesToDownload.push(p);
        }
    }

    let downloadedCount = SHAMARLY_TOTAL_PAGES - pagesToDownload.length;
    onProgress(Math.round((downloadedCount / SHAMARLY_TOTAL_PAGES) * 100), downloadedCount, SHAMARLY_TOTAL_PAGES);

    if (pagesToDownload.length === 0) {
        onProgress(100, SHAMARLY_TOTAL_PAGES, SHAMARLY_TOTAL_PAGES);
        return;
    }

    // 2. Concurrency pool
    const CONCURRENCY = 6;
    let nextIndex = 0;

    const worker = async () => {
        while (nextIndex < pagesToDownload.length) {
            if (signal?.aborted) {
                throw new Error('Download cancelled');
            }

            const page = pagesToDownload[nextIndex++];
            const primaryUrl = getShamarlyPageUrl(page);
            const fallbackUrl = getShamarlyFallbackUrl(page);

            try {
                let response = await fetch(primaryUrl, { signal });
                if (!response.ok) {
                    response = await fetch(fallbackUrl, { signal });
                }
                if (response.ok) {
                    await cache.put(primaryUrl, response.clone());
                }
            } catch (err: any) {
                if (err.name === 'AbortError' || signal?.aborted) {
                    throw new Error('Download cancelled');
                }
                // Try fallback once more
                try {
                    const fallbackRes = await fetch(fallbackUrl, { signal });
                    if (fallbackRes.ok) {
                        await cache.put(primaryUrl, fallbackRes.clone());
                    }
                } catch {
                    // Ignore single page error, continue to next
                }
            }

            downloadedCount++;
            const pct = Math.min(100, Math.round((downloadedCount / SHAMARLY_TOTAL_PAGES) * 100));
            onProgress(pct, downloadedCount, SHAMARLY_TOTAL_PAGES);
        }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pagesToDownload.length) }, () => worker());
    await Promise.all(workers);
}

/**
 * Remove Shamarly Mushaf cached images to free up disk space.
 */
export async function deleteShamarlyCache(): Promise<void> {
    if ('caches' in window) {
        await caches.delete(SHAMARLY_CACHE_NAME);
    }
}
