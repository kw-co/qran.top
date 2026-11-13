import { idbGet, idbSet } from '../utils/idb';

export interface QuranV4Word {
    id: number;
    position: number;
    audio_url?: string;
    text_uthmani: string;
    text_indopak?: string;
    text_indopak_nastaleeq?: string;
    code_v1?: string;
    v1_page?: number;
    text_tajweed?: string;
    location: string;
    line_number?: number;
    page_number?: number;
    char_type_name?: string;
    translation?: {
        text: string;
        language_name?: string;
    };
    transliteration?: {
        text: string;
    };
}

export interface QuranV4Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    text_tajweed?: string;
    juz_number?: number;
    words: QuranV4Word[];
}

export interface QuranV4TajweedVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani_tajweed: string;
}

const CACHE_KEY_PREFIX = 'quran_v4_chapter_v2_';
const TAJWEED_CACHE_PREFIX = 'quran_v4_tajweed_';

const memoryCache = new Map<number, QuranV4Verse[]>();
const tajweedMemoryCache = new Map<number, QuranV4TajweedVerse[]>();

/**
 * Fetch verses with word-by-word data from Quran.com API v4
 */
export async function fetchChapterVersesV4(chapterNumber: number): Promise<QuranV4Verse[]> {
    if (memoryCache.has(chapterNumber)) {
        return memoryCache.get(chapterNumber)!;
    }

    try {
        // Check fast IndexedDB first
        const dbCached = await idbGet<QuranV4Verse[]>(`${CACHE_KEY_PREFIX}${chapterNumber}`);
        if (dbCached && Array.isArray(dbCached) && dbCached.length > 0) {
            memoryCache.set(chapterNumber, dbCached);
            return dbCached;
        }

        // Fallback check legacy localStorage if available
        const localCached = localStorage.getItem(`${CACHE_KEY_PREFIX}${chapterNumber}`);
        if (localCached) {
            const parsed = JSON.parse(localCached);
            memoryCache.set(chapterNumber, parsed);
            idbSet(`${CACHE_KEY_PREFIX}${chapterNumber}`, parsed).catch(() => {});
            return parsed;
        }

        const url = `https://api.quran.com/api/v4/verses/by_chapter/${chapterNumber}?words=true&word_fields=text_uthmani,location,audio_url,code_v1,v1_page,char_type_name&per_page=300`;
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`API response error: ${res.status}`);
        }

        const data = await res.json();
        if (data.verses && data.verses.length > 0) {
            memoryCache.set(chapterNumber, data.verses);
            idbSet(`${CACHE_KEY_PREFIX}${chapterNumber}`, data.verses).catch(() => {});
            return data.verses;
        }
        return [];
    } catch (error) {
        console.warn(`[QuranApiV4] Failed to fetch chapter ${chapterNumber} from Quran.com API v4:`, error);
        return [];
    }
}

/**
 * Fetch Tajweed-formatted text (with HTML rule classes) from Quran.com API v4
 */
export async function fetchChapterTajweedVerses(chapterNumber: number): Promise<QuranV4TajweedVerse[]> {
    if (tajweedMemoryCache.has(chapterNumber)) {
        return tajweedMemoryCache.get(chapterNumber)!;
    }

    try {
        // Check fast IndexedDB first
        const dbCached = await idbGet<QuranV4TajweedVerse[]>(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`);
        if (dbCached && Array.isArray(dbCached) && dbCached.length > 0) {
            tajweedMemoryCache.set(chapterNumber, dbCached);
            return dbCached;
        }

        // Fallback check legacy localStorage if available
        const localCached = localStorage.getItem(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`);
        if (localCached) {
            const parsed = JSON.parse(localCached);
            tajweedMemoryCache.set(chapterNumber, parsed);
            idbSet(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`, parsed).catch(() => {});
            return parsed;
        }

        const url = `https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=${chapterNumber}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`API response error: ${res.status}`);
        }

        const data = await res.json();
        if (data.verses && Array.isArray(data.verses)) {
            const result: QuranV4TajweedVerse[] = data.verses.map((v: any) => {
                const parts = (v.verse_key || '').split(':');
                const vNum = parts.length > 1 ? parseInt(parts[1], 10) : v.id;
                return {
                    id: v.id,
                    verse_key: v.verse_key,
                    verse_number: vNum,
                    text_uthmani_tajweed: v.text_uthmani_tajweed || ''
                };
            });

            tajweedMemoryCache.set(chapterNumber, result);
            idbSet(`${TAJWEED_CACHE_PREFIX}${chapterNumber}`, result).catch(() => {});
            return result;
        }
        return [];
    } catch (error) {
        console.warn(`[QuranApiV4] Failed to fetch tajweed for chapter ${chapterNumber}:`, error);
        return [];
    }
}

/**
 * Resolve relative audio url for word-by-word pronunciation
 */
export function getWordAudioUrl(relativeAudioUrl: string): string {
    if (!relativeAudioUrl) return '';
    if (relativeAudioUrl.startsWith('http://') || relativeAudioUrl.startsWith('https://')) {
        return relativeAudioUrl;
    }
    const cleanPath = relativeAudioUrl.startsWith('/') ? relativeAudioUrl.substring(1) : relativeAudioUrl;
    return `https://audio.qurancdn.com/${cleanPath}`;
}

/**
 * Normalizes text for clean matching between Uthmani and Simple/Imlai Quranic script
 */
export function normalizeForWordMatch(text: string): string {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06E5\u06E6\u08F0-\u08FF]/g, '')
        .replace(/[أإآٱءؤئ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Plays word audio using smart Uthmani-to-Simple alignment and sequential word audio indexing
 */
export async function playSmartWordAudio(
    surahNum: number,
    ayahNum: number,
    approxWordIndexOneBased: number,
    clickedWordText?: string
): Promise<void> {
    try {
        let audioUrl: string | null = null;

        if (surahNum && ayahNum) {
            const chapterVerses = await fetchChapterVersesV4(surahNum);
            const verse = chapterVerses.find(v => v.verse_number === ayahNum);

            if (verse && verse.words && verse.words.length > 0) {
                // Filter strictly for actual spoken words ('word') to match CDN sequential audio files
                const filteredV4Words = verse.words.filter(w => (w as any).char_type_name === 'word');

                if (filteredV4Words.length > 0) {
                    const cleanClicked = clickedWordText ? normalizeForWordMatch(clickedWordText) : '';
                    const approxZeroIdx = Math.max(0, approxWordIndexOneBased - 1);

                    let targetSeqIndex = Math.min(approxWordIndexOneBased, filteredV4Words.length);

                    if (cleanClicked) {
                        let bestVIdx = 0;
                        let bestScore = -999;

                        filteredV4Words.forEach((vWord, vIdx) => {
                            const vNorm = normalizeForWordMatch(vWord.text_uthmani);
                            let score = 0;

                            if (vNorm === cleanClicked) {
                                score += 100;
                            } else if (vNorm.includes(cleanClicked) || cleanClicked.includes(vNorm)) {
                                score += 75;
                            } else {
                                const dist = getLevenshteinDistance(cleanClicked, vNorm);
                                const maxLen = Math.max(cleanClicked.length, vNorm.length);
                                if (maxLen > 0) {
                                    score += ((maxLen - dist) / maxLen) * 60;
                                }
                            }

                            const idxDiff = vIdx - approxZeroIdx;
                            if (idxDiff === 0) score += 20;
                            else if (idxDiff === 1 || idxDiff === -1) score += 15;
                            else if (idxDiff > 1) score -= (idxDiff - 1) * 3;
                            else if (idxDiff < -1) score -= Math.abs(idxDiff) * 8;

                            if (score > bestScore) {
                                bestScore = score;
                                bestVIdx = vIdx;
                            }
                        });

                        targetSeqIndex = bestVIdx + 1;
                    }

                    const surahPadded = String(surahNum).padStart(3, '0');
                    const ayahPadded = String(ayahNum).padStart(3, '0');
                    const wordPadded = String(targetSeqIndex).padStart(3, '0');
                    audioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
                }
            }
        }

        if (!audioUrl) {
            const surahPadded = String(surahNum).padStart(3, '0');
            const ayahPadded = String(ayahNum).padStart(3, '0');
            const wordPadded = String(approxWordIndexOneBased).padStart(3, '0');
            audioUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
        }

        const audio = new Audio(audioUrl);
        await audio.play();
    } catch (e) {
        const surahPadded = String(surahNum).padStart(3, '0');
        const ayahPadded = String(ayahNum).padStart(3, '0');
        const wordPadded = String(approxWordIndexOneBased).padStart(3, '0');
        const fallbackUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
        new Audio(fallbackUrl).play().catch(() => {});
    }
}


const pageMemoryCache = new Map<number, QuranV4Verse[]>();

function normalizeCachedPageVerses(verses: QuranV4Verse[]): QuranV4Verse[] {
    verses.forEach(v => {
        if (!v.text_uthmani && v.words) {
            v.text_uthmani = v.words
                .filter(w => w.char_type_name === 'word')
                .map(w => w.text_uthmani)
                .filter(Boolean)
                .join(' ');
        }
    });
    return verses;
}

/**
 * Offline fallback synthesizer: constructs a 15-line page structure from local IndexedDB Quran edition
 * if the user is offline and the v4 page layout has not yet been trickle-cached.
 */
async function synthesizeOfflinePageVerses(pageNumber: number): Promise<QuranV4Verse[]> {
    try {
        const surahs =
            (await idbGet<any[]>('edition_quran-uthmani-quran-academy')) ||
            (await idbGet<any[]>('edition_quran-simple-clean'));
        if (!surahs || !Array.isArray(surahs)) return [];

        const pageAyahs: Array<{ surahNum: number; ayah: any }> = [];
        for (const surah of surahs) {
            if (!surah?.ayahs) continue;
            for (const ayah of surah.ayahs) {
                if (ayah.page === pageNumber) {
                    pageAyahs.push({ surahNum: surah.number, ayah });
                }
            }
        }

        if (pageAyahs.length === 0) return [];

        const maxLines = pageNumber === 1 || pageNumber === 2 ? 8 : 15;
        const allWordsFlat: Array<{ surahNum: number; ayah: any; wordText: string; isEnd: boolean; pos: number }> = [];

        for (const { surahNum, ayah } of pageAyahs) {
            const rawWords = String(ayah.text || '').trim().split(/\s+/).filter(Boolean);
            rawWords.forEach((wText, idx) => {
                allWordsFlat.push({
                    surahNum,
                    ayah,
                    wordText: wText,
                    isEnd: false,
                    pos: idx + 1
                });
            });
            allWordsFlat.push({
                surahNum,
                ayah,
                wordText: ayah.numberInSurah.toLocaleString('ar-EG'),
                isEnd: true,
                pos: rawWords.length + 1
            });
        }

        const totalTokens = Math.max(1, allWordsFlat.length);
        const verseMap = new Map<string, QuranV4Verse>();
        let globalWordId = pageNumber * 10000;

        allWordsFlat.forEach((token, idx) => {
            const lineNum = Math.min(maxLines, Math.max(1, Math.floor((idx / totalTokens) * maxLines) + 1));
            const verseKey = `${token.surahNum}:${token.ayah.numberInSurah}`;
            if (!verseMap.has(verseKey)) {
                verseMap.set(verseKey, {
                    id: token.ayah.number || idx + 1,
                    verse_number: token.ayah.numberInSurah,
                    verse_key: verseKey,
                    text_uthmani: token.ayah.text || '',
                    juz_number: token.ayah.juz || 1,
                    words: []
                });
            }
            verseMap.get(verseKey)!.words.push({
                id: ++globalWordId,
                position: token.pos,
                text_uthmani: token.wordText,
                location: `${verseKey}:${token.pos}`,
                line_number: lineNum,
                page_number: pageNumber,
                char_type_name: token.isEnd ? 'end' : 'word'
            });
        });

        return Array.from(verseMap.values());
    } catch {
        return [];
    }
}

export async function fetchPageVersesV4(pageNumber: number): Promise<QuranV4Verse[]> {
    if (pageMemoryCache.has(pageNumber)) {
        return pageMemoryCache.get(pageNumber)!;
    }

    const cacheKey = `quran_v4_page_v3_${pageNumber}`;

    try {
        // 1. Check fast IndexedDB first
        const idbCached = await idbGet<QuranV4Verse[]>(cacheKey);
        if (idbCached && Array.isArray(idbCached) && idbCached.length > 0) {
            const normalized = normalizeCachedPageVerses(idbCached);
            pageMemoryCache.set(pageNumber, normalized);
            return normalized;
        }

        // 2. Check legacy localStorage fallback
        const localCached = localStorage.getItem(cacheKey);
        if (localCached) {
            const cachedVerses: QuranV4Verse[] = normalizeCachedPageVerses(JSON.parse(localCached));
            pageMemoryCache.set(pageNumber, cachedVerses);
            idbSet(cacheKey, cachedVerses).catch(() => {});
            return cachedVerses;
        }

        // 3. If offline, synthesize immediately from local IndexedDB Quran edition
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return await synthesizeOfflinePageVerses(pageNumber);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
            const url = `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&fields=text_uthmani&word_fields=text_uthmani,location,audio_url,char_type_name,line_number,page_number,code_v1,v1_page`;
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`API response error: ${res.status}`);

            const data = await res.json();
            if (data.verses && data.verses.length > 0) {
                const normalized = normalizeCachedPageVerses(data.verses);
                pageMemoryCache.set(pageNumber, normalized);
                idbSet(cacheKey, normalized).catch(() => {});
                return normalized;
            }
        } finally {
            clearTimeout(timer);
        }

        return await synthesizeOfflinePageVerses(pageNumber);
    } catch (error) {
        console.warn(`[QuranApiV4] Fallback to offline page synthesis for page ${pageNumber}:`, error);
        return await synthesizeOfflinePageVerses(pageNumber);
    }
}

/**
 * Silently prefetches and caches a page's v4 word/line layout into IndexedDB for background trickle loading
 */
export async function prefetchPageVersesV4Silent(pageNumber: number): Promise<boolean> {
    if (pageMemoryCache.has(pageNumber)) return true;
    const cacheKey = `quran_v4_page_v3_${pageNumber}`;
    try {
        const existing = await idbGet<QuranV4Verse[]>(cacheKey);
        if (existing && Array.isArray(existing) && existing.length > 0) {
            return true;
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
        const verses = await fetchPageVersesV4(pageNumber);
        return verses.length > 0 && verses.some(v => v.words.some(w => !!w.code_v1));
    } catch {
        return false;
    }
}

