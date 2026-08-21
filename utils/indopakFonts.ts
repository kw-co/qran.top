export const INDOPAK_FONTS_VERSION = 'v2';
export const INDOPAK_TOTAL_PAGES = 610;
export const INDOPAK_CACHE_NAME = 'quran-indopak-fonts-v2';

// CDN URLs for authentic IndoPak Nastaleeq fonts used by Quran.com / Tarteel QUL
export const INDOPAK_FONT_URLS = [
    'https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/normal-v4.2.2/with-waqf-lazmi/font.woff2',
    'https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/KFGQPCNastaleeq-Regular.woff2',
    'https://static-cdn.tarteel.ai/qul/fonts/dk/DigitalKhattIndoPak.woff2'
];

let isIndoPakStyleInjected = false;

/**
 * Inject the @font-face definition for IndoPak Nastaleeq script
 */
export function injectIndoPakFontFace() {
    if (isIndoPakStyleInjected) return;
    const styleId = 'indopak-fonts-style';
    const existing = document.getElementById(styleId);
    if (existing) {
        existing.remove();
    }

    const css = `
@font-face {
  font-family: 'IndoPakNastaleeq';
  src: url('${INDOPAK_FONT_URLS[0]}') format('woff2'),
       url('${INDOPAK_FONT_URLS[1]}') format('woff2'),
       url('${INDOPAK_FONT_URLS[2]}') format('woff2');
  font-display: swap;
  font-style: normal;
  font-weight: normal;
}

.font-indopak {
  font-family: 'IndoPakNastaleeq', 'Amiri Quran', serif !important;
  font-feature-settings: "cv01" on, "cv02" on, "ss01" on, "liga" on, "calt" on !important;
  line-height: 2.3 !important;
  word-spacing: 0.18em;
  letter-spacing: 0;
}

.indopak-ayah-end {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 1.45em;
  height: 1.45em;
  margin: 0 0.2em;
  vertical-align: middle;
}

.indopak-ayah-circle {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1.5px solid #d97706;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 70%, transparent 100%);
}

.indopak-ayah-number {
  position: relative;
  font-size: 0.65em;
  font-weight: bold;
  color: #b45309;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1;
}
`;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
    isIndoPakStyleInjected = true;
}

/**
 * Download the IndoPak font package and store it in Cache Storage for offline use
 */
export async function downloadIndoPakPackage(
    onProgress: (progress: number) => void,
    signal?: AbortSignal
): Promise<void> {
    const cache = await caches.open(INDOPAK_CACHE_NAME);
    const urls = INDOPAK_FONT_URLS;
    let completed = 0;

    onProgress(10);

    for (let i = 0; i < urls.length; i++) {
        if (signal?.aborted) {
            throw new Error('Download cancelled');
        }

        const url = urls[i];
        try {
            const fetchRes = await fetch(url, { signal });
            if (fetchRes.ok) {
                await cache.put(url, fetchRes);
                completed++;
                const currentProgress = Math.round(10 + (completed / urls.length) * 85);
                onProgress(currentProgress);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                throw new Error('Download cancelled');
            }
            console.warn(`[IndoPakFonts] Failed to fetch ${url}:`, e);
        }
    }

    // Also inject the font styles immediately
    injectIndoPakFontFace();
    onProgress(100);
}

/**
 * Check if the IndoPak font package is already saved in Cache Storage
 */
export async function checkIndoPakDownloaded(): Promise<boolean> {
    try {
        const cache = await caches.open(INDOPAK_CACHE_NAME);
        for (const url of INDOPAK_FONT_URLS) {
            const res = await cache.match(url);
            if (res) {
                // If at least the primary font is cached, it's ready
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Delete the IndoPak font package from Cache Storage
 */
export async function deleteIndoPakPackage(): Promise<boolean> {
    try {
        return await caches.delete(INDOPAK_CACHE_NAME);
    } catch (e) {
        return false;
    }
}
