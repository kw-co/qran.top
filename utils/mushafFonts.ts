export const MUSHAF_FONTS_VERSION = 'v1';
export const TOTAL_PAGES = 604;
export const CACHE_NAME = 'quran-mushaf-fonts-v1';

// The reliable URL for Hafs v1 WOFF2 fonts
export const getFontUrl = (pageNum: number) => `https://fonts.quran.com/quran/hafs/v1/woff2/p${pageNum}.woff2`;

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
  src: url('${getFontUrl(i)}') format('woff2');
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

export async function downloadAllMushafFonts(
    onProgress: (progress: number) => void,
    signal?: AbortSignal
): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    
    // 1. Identify what we already have
    const missingPages: number[] = [];
    let downloadedCount = 0;
    
    for (let i = 1; i <= TOTAL_PAGES; i++) {
        const res = await cache.match(getFontUrl(i));
        if (res) {
            downloadedCount++;
        } else {
            missingPages.push(i);
        }
    }
    
    // Initial progress report (if they already have 50%, start there)
    onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));

    if (missingPages.length === 0) {
        return; // All done!
    }
    
    // 2. Download missing pages in small batches to avoid rate limiting
    const BATCH_SIZE = 5; 
    for (let i = 0; i < missingPages.length; i += BATCH_SIZE) {
        if (signal?.aborted) {
            throw new Error('Download cancelled');
        }
        
        const batch = missingPages.slice(i, i + BATCH_SIZE);
        const fetchPromises = batch.map(async (pageNum) => {
            if (signal?.aborted) return;
            const url = getFontUrl(pageNum);
            try {
                const fetchRes = await fetch(url, { signal });
                if (fetchRes.ok) {
                    await cache.put(url, fetchRes);
                    downloadedCount++;
                    onProgress(Math.round((downloadedCount / TOTAL_PAGES) * 100));
                } else if (fetchRes.status === 429) {
                    // Rate limit hit, wait a bit longer (handled below ideally)
                    throw new Error('Rate limited');
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.warn(`Failed to fetch font page ${pageNum}:`, e);
                }
            }
        });
        
        await Promise.allSettled(fetchPromises);
        
        // Add a small delay between batches to be gentle on the server
        if (i + BATCH_SIZE < missingPages.length && !signal?.aborted) {
            await new Promise(res => setTimeout(res, 300));
        }
    }
    
    // Final check to see if we actually got everything
    if (downloadedCount < TOTAL_PAGES && !signal?.aborted) {
        throw new Error('Some files failed to download. Please try again to fetch the remaining files.');
    }
}

export async function checkMushafFontsDownloaded(): Promise<boolean> {
    const cache = await caches.open(CACHE_NAME);
    const sampleUrls = [
        getFontUrl(1),
        getFontUrl(300),
        getFontUrl(604)
    ];
    
    for (const url of sampleUrls) {
        const res = await cache.match(url);
        if (!res) return false;
    }
    return true;
}

export async function deleteMushafFonts(): Promise<boolean> {
    return await caches.delete(CACHE_NAME);
}
