import { Ayah, SurahData } from '../types';
import { normalizeArabicText, stripDiacritics } from './text';
import { computeArabicRoot } from './roots';

export const MUQATTAAT_29_SURAHS = [
    2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68
];

export const HAWAMEEM_7_SURAHS = [
    40, 41, 42, 43, 44, 45, 46
];

export interface FingerprintMatch {
    word: string; // The normalized display word
    count: number; // Total frequency in the entire Quran
}

// Global cache for fingerprint indices to avoid rebuilding on every click
let cachedMuqattaatIndex: Record<string, FingerprintMatch[]> | null = null;
let cachedMuqattaatRootIndex: Record<string, FingerprintMatch[]> | null = null;
let cachedHawameemIndex: Record<string, FingerprintMatch[]> | null = null;
let cachedHawameemRootIndex: Record<string, FingerprintMatch[]> | null = null;

const buildIndex = (surahDataList: SurahData[], targetSurahs: number[], isRoot: boolean = false): Record<string, FingerprintMatch[]> => {
    const wordToSurahs = new Map<string, Set<number>>();
    const wordCounts = new Map<string, number>();

    for (const surah of surahDataList) {
        for (const ayah of surah.ayahs) {
            if (!ayah.text) continue;
            
            const surahNumber = surah.number;
            const words = ayah.text.split(/\s+/);
            
            for (const rawWord of words) {
                const stripped = stripDiacritics(rawWord);
                if (!stripped) continue;
                
                let normalized = normalizeArabicText(stripped);
                if (isRoot) {
                    normalized = computeArabicRoot(normalized);
                }
                if (!normalized) continue;
                
                if (!wordToSurahs.has(normalized)) {
                    wordToSurahs.set(normalized, new Set());
                }
                wordToSurahs.get(normalized)!.add(surahNumber);
                
                wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
            }
        }
    }

    const footprintToWords: Record<string, FingerprintMatch[]> = {};
    
    for (const [normalized, surahs] of wordToSurahs.entries()) {
        let footprint = "";
        for (const s of targetSurahs) {
            footprint += surahs.has(s) ? "1" : "0";
        }
        
        if (!footprintToWords[footprint]) {
            footprintToWords[footprint] = [];
        }
        
        footprintToWords[footprint].push({
            word: normalized,
            count: wordCounts.get(normalized) || 0
        });
    }

    // Sort words in each footprint by their total frequency in Quran (descending)
    for (const key of Object.keys(footprintToWords)) {
        footprintToWords[key].sort((a, b) => b.count - a.count);
    }

    return footprintToWords;
};

export const findWordsByFingerprint = (
    surahDataList: SurahData[],
    targetFingerprint: string,
    isHawameem: boolean,
    isRoot: boolean = false
): FingerprintMatch[] => {
    if (isHawameem) {
        if (isRoot) {
            if (!cachedHawameemRootIndex) {
                cachedHawameemRootIndex = buildIndex(surahDataList, HAWAMEEM_7_SURAHS, true);
            }
            return cachedHawameemRootIndex[targetFingerprint] || [];
        } else {
            if (!cachedHawameemIndex) {
                cachedHawameemIndex = buildIndex(surahDataList, HAWAMEEM_7_SURAHS, false);
            }
            return cachedHawameemIndex[targetFingerprint] || [];
        }
    } else {
        if (isRoot) {
            if (!cachedMuqattaatRootIndex) {
                cachedMuqattaatRootIndex = buildIndex(surahDataList, MUQATTAAT_29_SURAHS, true);
            }
            return cachedMuqattaatRootIndex[targetFingerprint] || [];
        } else {
            if (!cachedMuqattaatIndex) {
                cachedMuqattaatIndex = buildIndex(surahDataList, MUQATTAAT_29_SURAHS, false);
            }
            return cachedMuqattaatIndex[targetFingerprint] || [];
        }
    }
};
