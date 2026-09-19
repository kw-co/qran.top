import { normalizeArabicText, stripDiacritics } from './text';
import type { SurahData, Ayah } from '../types';

/**
 * The 14 Muqatta'at / Noorani Letters (حروف الفواتح النورانية الـ 14):
 * نص حكيم قاطع له سر / صراط علي حق نمسكه
 */
export const PURE_NOORANI_LETTERS: string[] = [
    'ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن'
];

export const NOORANI_LETTERS_WITH_WAW: string[] = [
    ...PURE_NOORANI_LETTERS,
    'و'
];

export const NON_NOORANI_LETTERS_STANDARD: string[] = [
    'ب', 'ت', 'ث', 'ج', 'خ', 'د', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف', 'و'
];

export const ALL_ARABIC_LETTERS_ORDERED: string[] = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 
    'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const NOORANI_MNEMONICS = [
    { title: "نَصٌّ حَكِيمٌ قَاطِعٌ لَهُ سِرٌّ", letters: "ن ص ح ك ي م ق ا ط ع ل ه س ر" },
    { title: "صِرَاطُ عَلِيٍّ حَقٌّ نُمْسِكُهُ", letters: "ص ر ا ط ع ل ي ح ق ن م س ك ه" },
    { title: "طَرَقَ سَمْعَكَ نَصِيحَةٌ", letters: "ط ر ق س م ع ك ن ص ي ح ه" },
    { title: "سِحْرُ نَصِّهِ عَلَّمَكَ حَقّاً", letters: "س ح ر ن ص ه ع ل م ك ح ق ا" },
];

/**
 * Normalizes a single Arabic character for Noorani classification
 */
export function normalizeCharForNoorani(char: string): string {
    if (!char) return '';
    // Alif variants
    if (/[أإآٱء]/.test(char)) return 'ا';
    // Ya / Alef Maksura variants
    if (/[يىئ]/.test(char)) return 'ي';
    // Ta Marbuta -> Ha
    if (char === 'ة') return 'ه';
    // Waw with Hamza -> Waw
    if (char === 'ؤ') return 'و';
    // Keheh -> Kaf
    if (char === 'ک') return 'ك';
    return char;
}

export interface WordNooraniAnalysis {
    originalText: string;
    normalizedText: string;
    isPureNoorani: boolean;
    totalLetters: number;
    nooraniLettersCount: number;
    nonNooraniLetters: string[];
}

export interface AyahNooraniAnalysis {
    surahNumber: number;
    surahName: string;
    surahEnglishName?: string;
    isMeccan: boolean;
    ayahNumberInSurah: number;
    ayahNumberGlobal: number;
    page: number;
    juz: number;
    hizbQuarter: number;
    textOriginal: string;
    textNormalized: string;
    totalLetters: number;
    nooraniLettersCount: number;
    nonNooraniLettersCount: number;
    percentage: number; // 0 to 100
    isPure: boolean; // 100% Noorani
    isFatihahMuqattaa: boolean; // e.g. "الم", "كهيعص", "طه", "يس", "حم", "ق", "ن"
    nonNooraniLettersFound: { letter: string; count: number }[];
    words: WordNooraniAnalysis[];
    longestNooraniWordStreak: {
        startIndex: number;
        endIndex: number;
        length: number;
        text: string;
    };
}

export interface NooraniScanFilterOptions {
    allowWaw: boolean;
    purityThreshold: number; // 100 (pure only), 90 (>=90%), 80, 0 (all)
    excludeFawatih: boolean; // Exclude single muqattaat word openings like "الم", "طه"
    surahNumber?: number; // Filter by specific surah
    surahScope: 'all' | 'fawatih_surahs' | 'hawamim_surahs' | 'meccan' | 'medinan';
    customAllowedLetters?: string[]; // If custom letter set is used
}

// 29 Surahs with Muqatta'at (السور النورانية الـ 29)
export const FAWATIH_SURAHS_NUMBERS = [
    2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68
];

// 7 Hawamim Surahs (سور آل حم السبعة المتتالية من غافر 40 إلى الأحقاف 46)
export const HAWAMIM_SURAHS_NUMBERS = [40, 41, 42, 43, 44, 45, 46];

// Hawamim Letters (حروف فواتح الحواميم: ح، م)
export const HAWAMIM_LETTERS = ['ح', 'م'];
export const HAWAMIM_LETTERS_WITH_WAW = ['ح', 'م', 'و'];

/**
 * Checks if an Ayah text is a standard Muqatta'at opening (like "الم", "يس", "حم", "كهيعص", etc.)
 */
export function isFatihahMuqattaaText(text: string): boolean {
    const clean = normalizeArabicText(text).replace(/\s+/g, '');
    const knownFawatih = [
        'الم', 'المر', 'الر', 'طسم', 'طس', 'طه', 'كهيعص', 'حم', 'عسق', 'حمعسق', 'يس', 'ص', 'ق', 'ن'
    ];
    return knownFawatih.includes(clean);
}

/**
 * Analyzes a single ayah given an active set of allowed Noorani letters
 */
export function analyzeAyah(
    ayah: Ayah,
    surah: SurahData,
    allowedLettersSet: Set<string>
): AyahNooraniAnalysis {
    const cleanText = stripDiacritics(ayah.text);
    const rawWords = cleanText.split(/\s+/).filter(Boolean);

    const wordsAnalysis: WordNooraniAnalysis[] = [];
    const nonNooraniCountMap: { [key: string]: number } = {};
    let totalLetters = 0;
    let nooraniLettersCount = 0;
    let nonNooraniLettersCount = 0;

    let currentStreakStart = -1;
    let currentStreakLength = 0;
    let maxStreakStart = 0;
    let maxStreakEnd = 0;
    let maxStreakLength = 0;

    rawWords.forEach((word, wIdx) => {
        let wordTotalLetters = 0;
        let wordNooraniLetters = 0;
        const wordNonNoorani: string[] = [];

        for (const rawChar of word) {
            // Check if it's an Arabic letter
            if (/[\u0621-\u064A]/.test(rawChar)) {
                const normChar = normalizeCharForNoorani(rawChar);
                wordTotalLetters++;
                totalLetters++;

                if (allowedLettersSet.has(normChar)) {
                    wordNooraniLetters++;
                    nooraniLettersCount++;
                } else {
                    wordNonNoorani.push(normChar);
                    nonNooraniLettersCount++;
                    nonNooraniCountMap[normChar] = (nonNooraniCountMap[normChar] || 0) + 1;
                }
            }
        }

        const isWordPure = wordNonNoorani.length === 0 && wordTotalLetters > 0;
        wordsAnalysis.push({
            originalText: word,
            normalizedText: normalizeArabicText(word),
            isPureNoorani: isWordPure,
            totalLetters: wordTotalLetters,
            nooraniLettersCount: wordNooraniLetters,
            nonNooraniLetters: wordNonNoorani
        });

        // Track longest streak of pure words
        if (isWordPure) {
            if (currentStreakStart === -1) {
                currentStreakStart = wIdx;
            }
            currentStreakLength++;
            if (currentStreakLength > maxStreakLength) {
                maxStreakLength = currentStreakLength;
                maxStreakStart = currentStreakStart;
                maxStreakEnd = wIdx;
            }
        } else {
            currentStreakStart = -1;
            currentStreakLength = 0;
        }
    });

    const percentage = totalLetters > 0 
        ? Math.round((nooraniLettersCount / totalLetters) * 1000) / 10 
        : 0;

    const nonNooraniLettersFound = Object.entries(nonNooraniCountMap)
        .map(([letter, count]) => ({ letter, count }))
        .sort((a, b) => b.count - a.count);

    const longestStreakText = maxStreakLength > 0
        ? rawWords.slice(maxStreakStart, maxStreakEnd + 1).join(' ')
        : '';

    const isFatihah = isFatihahMuqattaaText(ayah.text);

    return {
        surahNumber: surah.number,
        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
        surahEnglishName: surah.englishName,
        isMeccan: surah.revelationType === 'Meccan',
        ayahNumberInSurah: ayah.numberInSurah,
        ayahNumberGlobal: ayah.number,
        page: ayah.page,
        juz: ayah.juz,
        hizbQuarter: ayah.hizbQuarter,
        textOriginal: ayah.text,
        textNormalized: normalizeArabicText(ayah.text),
        totalLetters,
        nooraniLettersCount,
        nonNooraniLettersCount,
        percentage,
        isPure: nonNooraniLettersCount === 0 && totalLetters > 0,
        isFatihahMuqattaa: isFatihah,
        nonNooraniLettersFound,
        words: wordsAnalysis,
        longestNooraniWordStreak: {
            startIndex: maxStreakStart,
            endIndex: maxStreakEnd,
            length: maxStreakLength,
            text: longestStreakText
        }
    };
}

/**
 * Scans all Quranic ayahs based on active filter options
 */
export function scanQuranNoorani(
    quranData: SurahData[],
    options: NooraniScanFilterOptions
): {
    results: AyahNooraniAnalysis[];
    stats: {
        totalAyahsScanned: number;
        pureAyahsCount: number;
        highDensityAyahsCount: number; // >= 90%
        mediumDensityAyahsCount: number; // >= 80%
        totalNooraniLettersInQuran: number;
        totalLettersInQuran: number;
        overallNooraniPercentage: number;
        letterFrequencyInMatched: { [key: string]: number };
        surahDistribution: { surahNumber: number; surahName: string; count: number }[];
    };
} {
    const allowedLetters = options.customAllowedLetters && options.customAllowedLetters.length > 0
        ? options.customAllowedLetters
        : (options.allowWaw ? NOORANI_LETTERS_WITH_WAW : PURE_NOORANI_LETTERS);

    const allowedSet = new Set(allowedLetters.map(normalizeCharForNoorani));

    const results: AyahNooraniAnalysis[] = [];
    let totalAyahsScanned = 0;
    let pureAyahsCount = 0;
    let highDensityAyahsCount = 0;
    let mediumDensityAyahsCount = 0;
    let totalNooraniLettersInQuran = 0;
    let totalLettersInQuran = 0;
    const letterFreq: { [key: string]: number } = {};
    const surahDistMap: { [key: number]: { surahNumber: number; surahName: string; count: number } } = {};

    quranData.forEach(surah => {
        // Scope filters
        if (options.surahNumber && surah.number !== options.surahNumber) return;
        if (options.surahScope === 'fawatih_surahs' && !FAWATIH_SURAHS_NUMBERS.includes(surah.number)) return;
        if (options.surahScope === 'hawamim_surahs' && !HAWAMIM_SURAHS_NUMBERS.includes(surah.number)) return;
        if (options.surahScope === 'meccan' && surah.revelationType !== 'Meccan') return;
        if (options.surahScope === 'medinan' && surah.revelationType === 'Meccan') return;

        surah.ayahs.forEach(ayah => {
            totalAyahsScanned++;
            const analysis = analyzeAyah(ayah, surah, allowedSet);

            totalLettersInQuran += analysis.totalLetters;
            totalNooraniLettersInQuran += analysis.nooraniLettersCount;

            if (analysis.isPure) pureAyahsCount++;
            if (analysis.percentage >= 90) highDensityAyahsCount++;
            if (analysis.percentage >= 80) mediumDensityAyahsCount++;

            // Exclude fawatih filter if active
            if (options.excludeFawatih && analysis.isFatihahMuqattaa) {
                return;
            }

            // Check purity threshold
            if (analysis.percentage >= options.purityThreshold) {
                results.push(analysis);

                // Update surah distribution
                if (!surahDistMap[surah.number]) {
                    surahDistMap[surah.number] = {
                        surahNumber: surah.number,
                        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                        count: 0
                    };
                }
                surahDistMap[surah.number].count++;

                // Track letter frequency in results
                const clean = stripDiacritics(ayah.text);
                for (const char of clean) {
                    if (/[\u0621-\u064A]/.test(char)) {
                        const norm = normalizeCharForNoorani(char);
                        letterFreq[norm] = (letterFreq[norm] || 0) + 1;
                    }
                }
            }
        });
    });

    const surahDistribution = Object.values(surahDistMap).sort((a, b) => b.count - a.count);

    return {
        results,
        stats: {
            totalAyahsScanned,
            pureAyahsCount,
            highDensityAyahsCount,
            mediumDensityAyahsCount,
            totalNooraniLettersInQuran,
            totalLettersInQuran,
            overallNooraniPercentage: totalLettersInQuran > 0 
                ? Math.round((totalNooraniLettersInQuran / totalLettersInQuran) * 1000) / 10 
                : 0,
            letterFrequencyInMatched: letterFreq,
            surahDistribution
        }
    };
}
