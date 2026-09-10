export const MUSHAF_FONTS_VERSION = 'v1';
export const TOTAL_PAGES = 604;
export const CACHE_NAME = 'quran-mushaf-fonts-v1';

// Primary URL: Local assets hosted alongside the application in GitHub / static host
export const getPrimaryFontUrl = (pageNum: number) => `./fonts/mushaf/p${pageNum}.woff2`;

// Fallback mirror URLs if local asset is unreachable
export const getFallbackFontUrls = (pageNum: number) => [
    `./fonts/mushaf/p${pageNum}.woff2`,
    `https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${pageNum}.woff2`,
    `https://fonts.quran.com/quran/hafs/v1/woff2/p${pageNum}.woff2`
];

// Default single URL for backwards compatibility
export const getFontUrl = (pageNum: number) => getPrimaryFontUrl(pageNum);

let isStyleInjected = false;

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
  src: url('./fonts/mushaf/p${i}.woff2') format('woff2'),
       url('https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${i}.woff2') format('woff2'),
       url('https://fonts.quran.com/quran/hafs/v1/woff2/p${i}.woff2') format('woff2');
  font-display: block;
}
.font-p${i} { font-family: 'p${i}', 'QCF_P${String(i).padStart(3, '0')}'; }
`;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
    isStyleInjected = true;
}

/**
 * Ensures a specific page font is loaded into the browser memory before rendering,
 * preventing FOUT (Flash of Unstyled Text / strange characters).
 */
export async function ensurePageFontLoaded(pageNum: number): Promise<boolean> {
    injectMushafFontFaces();
    if (!('fonts' in document)) return true;
    try {
        await (document as any).fonts.load(`16px p${pageNum}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Preloads adjacent page fonts (previous and next pages) in the background
 * so that turning pages is instantaneous with zero rendering lag.
 */
export function preloadAdjacentPageFonts(currentPage: number) {
    if (!('fonts' in document)) return;
    const pagesToPreload = [
        currentPage + 1,
        currentPage - 1,
        currentPage + 2,
        currentPage - 2
    ].filter(p => p >= 1 && p <= TOTAL_PAGES);

    for (const page of pagesToPreload) {
        (document as any).fonts.load(`16px p${page}`).catch(() => {});
    }
}

/**
 * Downloads all 604 mushaf page fonts into CacheStorage.
 * Tries local hosted files first, then falls back to mirrors.
 * Fast parallel downloads with concurrency pool.
 */
export async function downloadAllMushafFonts(
    onProgress: (progress: number) => void,
    signal?: AbortSignal
): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    
    // 1. Identify which pages are already cached
    const missingPages: number[] = [];
    let downloadedCount = 0;
    
    for (let i = 1; i <= TOTAL_PAGES; i++) {
        const res = await cache.match(getPrimaryFontUrl(i)) || 
                    await cache.match(`https://fonts.quran.com/quran/hafs/v1/woff2/p${i}.woff2`) ||
                    await cache.match(`https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${i}.woff2`);
        if (res) {
            downloadedCount++;
        } else {
            missingPages.push(i);
        }
    }
    
    // Initial progress report
    onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));

    if (missingPages.length === 0) {
        return; // All 604 pages already downloaded!
    }
    
    // 2. Download missing pages in parallel pool (batch size 20)
    const BATCH_SIZE = 20;
    for (let i = 0; i < missingPages.length; i += BATCH_SIZE) {
        if (signal?.aborted) {
            throw new Error('Download cancelled');
        }
        
        const batch = missingPages.slice(i, i + BATCH_SIZE);
        const fetchPromises = batch.map(async (pageNum) => {
            if (signal?.aborted) return;
            const urls = getFallbackFontUrls(pageNum);
            
            for (const url of urls) {
                try {
                    const fetchRes = await fetch(url, { signal });
                    if (fetchRes.ok) {
                        // Store in cache for primary and mirror keys
                        await cache.put(getPrimaryFontUrl(pageNum), fetchRes.clone());
                        await cache.put(`https://fonts.quran.com/quran/hafs/v1/woff2/p${pageNum}.woff2`, fetchRes);
                        downloadedCount++;
                        onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));
                        return;
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError') throw e;
                    // Try next fallback URL
                }
            }
            console.warn(`[MushafFonts] Could not fetch font for page ${pageNum} from any source.`);
        });
        
        await Promise.allSettled(fetchPromises);
    }
    
    // Final check
    if (downloadedCount < TOTAL_PAGES && !signal?.aborted) {
        // If > 95% downloaded, accept it or warn
        if (downloadedCount >= 580) {
            onProgress(100);
            return;
        }
        throw new Error('بعض الخطوط لم تكتمل، يرجى المحاولة مرة أخرى.');
    }
    onProgress(100);
}

export async function checkMushafFontsDownloaded(): Promise<boolean> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const samplePages = [1, 50, 150, 300, 450, 604];
        
        for (const page of samplePages) {
            const res = await cache.match(getPrimaryFontUrl(page)) ||
                        await cache.match(`https://fonts.quran.com/quran/hafs/v1/woff2/p${page}.woff2`) ||
                        await cache.match(`https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${page}.woff2`);
            if (!res) return false;
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteMushafFonts(): Promise<boolean> {
    try {
        return await caches.delete(CACHE_NAME);
    } catch {
        return false;
    }
}

