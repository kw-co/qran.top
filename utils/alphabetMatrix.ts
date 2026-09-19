import { normalizeArabicText, stripDiacritics } from './text';
import type { SurahData, Ayah } from '../types';
import { normalizeCharForNoorani, PURE_NOORANI_LETTERS, NOORANI_LETTERS_WITH_WAW } from './nooraniAyahs';

export interface LetterMeta {
    char: string;
    name: string;
    abjad: number;
    category: string;
    makhraj: string;
    isNoorani: boolean;
    isQalqalah: boolean;
    isIstilaa: boolean;
    isShamsi: boolean;
}

export const ARABIC_LETTERS_META: LetterMeta[] = [
    { char: 'ا', name: 'ألف', abjad: 1, category: 'جوفي / مد', makhraj: 'الجوف', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'ب', name: 'باء', abjad: 2, category: 'شفوي', makhraj: 'الشفتان', isNoorani: false, isQalqalah: true, isIstilaa: false, isShamsi: false },
    { char: 'ت', name: 'تاء', abjad: 400, category: 'لساني / همس', makhraj: 'طرف اللسان', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ث', name: 'ثاء', abjad: 500, category: 'لثوي / همس', makhraj: 'طرف اللسان مع أطراف الثنايا', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ج', name: 'جيم', abjad: 3, category: 'شجري', makhraj: 'وسط اللسان', isNoorani: false, isQalqalah: true, isIstilaa: false, isShamsi: false },
    { char: 'ح', name: 'حاء', abjad: 8, category: 'حلقي / نوراني', makhraj: 'وسط الحلق', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'خ', name: 'خاء', abjad: 600, category: 'حلقي / تفخيم', makhraj: 'أدنى الحلق', isNoorani: false, isQalqalah: false, isIstilaa: true, isShamsi: false },
    { char: 'د', name: 'دال', abjad: 4, category: 'نطعي', makhraj: 'طرف اللسان وأصول الثنايا', isNoorani: false, isQalqalah: true, isIstilaa: false, isShamsi: true },
    { char: 'ذ', name: 'ذال', abjad: 700, category: 'لثوي', makhraj: 'طرف اللسان مع أطراف الثنايا', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ر', name: 'راء', abjad: 200, category: 'ذلقي / نوراني', makhraj: 'طرف اللسان مائل للظهر', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ز', name: 'زاي', abjad: 7, category: 'أسلي / صفير', makhraj: 'طرف اللسان مع فوق الثنايا', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'س', name: 'سين', abjad: 60, category: 'أسلي / صفير / نوراني', makhraj: 'طرف اللسان مع فوق الثنايا', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ش', name: 'شين', abjad: 300, category: 'شجري / تفشي', makhraj: 'وسط اللسان', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ص', name: 'صاد', abjad: 90, category: 'صفير / استعلاء / نوراني', makhraj: 'طرف اللسان مع فوق الثنايا', isNoorani: true, isQalqalah: false, isIstilaa: true, isShamsi: true },
    { char: 'ض', name: 'ضاد', abjad: 800, category: 'حافي / استطالة / تفخيم', makhraj: 'إحدى حافتي اللسان', isNoorani: false, isQalqalah: false, isIstilaa: true, isShamsi: true },
    { char: 'ط', name: 'طاء', abjad: 9, category: 'نطعي / قلقلة / تفخيم / نوراني', makhraj: 'طرف اللسان وأصول الثنايا', isNoorani: true, isQalqalah: true, isIstilaa: true, isShamsi: true },
    { char: 'ظ', name: 'ظاء', abjad: 900, category: 'لثوي / تفخيم', makhraj: 'طرف اللسان مع أطراف الثنايا', isNoorani: false, isQalqalah: false, isIstilaa: true, isShamsi: true },
    { char: 'ع', name: 'عين', abjad: 70, category: 'حلقي / نوراني', makhraj: 'وسط الحلق', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'غ', name: 'غين', abjad: 1000, category: 'حلقي / تفخيم', makhraj: 'أدنى الحلق', isNoorani: false, isQalqalah: false, isIstilaa: true, isShamsi: false },
    { char: 'ف', name: 'فاء', abjad: 80, category: 'شفوي / همس', makhraj: 'بطن الشفة السفلى', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'ق', name: 'قاف', abjad: 100, category: 'لهوي / قلقلة / تفخيم / نوراني', makhraj: 'أقصى اللسان فوق', isNoorani: true, isQalqalah: true, isIstilaa: true, isShamsi: false },
    { char: 'ك', name: 'كاف', abjad: 20, category: 'لهوي / همس / نوراني', makhraj: 'أقصى اللسان أسفل القاف', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'ل', name: 'لام', abjad: 30, category: 'ذلقي / نوراني', makhraj: 'أدنى حافة اللسان لمنتهاها', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'م', name: 'ميم', abjad: 40, category: 'شفوي / غنة / نوراني', makhraj: 'الشفتان معاً', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'ن', name: 'نون', abjad: 50, category: 'ذلقي / غنة / نوراني', makhraj: 'طرف اللسان تحت اللام', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: true },
    { char: 'ه', name: 'هاء', abjad: 5, category: 'حلقي / خفاء / نوراني', makhraj: 'أقصى الحلق', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'و', name: 'واو', abjad: 6, category: 'شفوي / مد ولين', makhraj: 'الشفتان بانضمام', isNoorani: false, isQalqalah: false, isIstilaa: false, isShamsi: false },
    { char: 'ي', name: 'ياء', abjad: 10, category: 'شجري / مد ولين / نوراني', makhraj: 'وسط اللسان', isNoorani: true, isQalqalah: false, isIstilaa: false, isShamsi: false },
];

export interface LetterGroupPreset {
    id: string;
    title: string;
    badge: string;
    category: 'tajweed' | 'noorani' | 'fawatih' | 'linguistic';
    description: string;
    letters: string[];
}

export const LETTER_GROUP_PRESETS: LetterGroupPreset[] = [
    // Noorani & Fawatih
    {
        id: 'noorani-pure',
        title: 'الحروف النورانية الـ 14 (الصافية)',
        badge: '14 حرفاً',
        category: 'noorani',
        description: 'حروف فواتح السور المقطعة (نص حكيم قاطع له سر)',
        letters: PURE_NOORANI_LETTERS
    },
    {
        id: 'noorani-waw',
        title: 'الحروف النورانية + الواو',
        badge: '15 حرفاً',
        category: 'noorani',
        description: 'الحروف النورانية مضافاً إليها واو العطف والصلة',
        letters: NOORANI_LETTERS_WITH_WAW
    },
    {
        id: 'all-letters',
        title: 'كافة حروف المعجم الـ 28',
        badge: '28 حرفاً',
        category: 'linguistic',
        description: 'جميع حروف اللغة العربية لاختبار الآيات الجامعة',
        letters: ARABIC_LETTERS_META.map(l => l.char)
    },
    {
        id: 'non-noorani',
        title: 'الحروف غير النورانية (الـ 14 المتبقية)',
        badge: '14 حرفاً',
        category: 'noorani',
        description: 'الحروف الهجائية التي لم تذكر في أوائل السور',
        letters: ['ب', 'ت', 'ث', 'ج', 'خ', 'د', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف', 'و']
    },
    // Tajweed
    {
        id: 'halq',
        title: 'حروف الإظهار الحلقي (6 حروف)',
        badge: 'حلقية',
        category: 'tajweed',
        description: 'الهمزة والهاء والعين والحاء والغين والخاء (أخي هاك علما حازه غير خاسر)',
        letters: ['ا', 'ه', 'ع', 'ح', 'غ', 'خ']
    },
    {
        id: 'qalqalah',
        title: 'حروف القلقلة (قطب جد)',
        badge: 'قلقلة',
        category: 'tajweed',
        description: 'الحروف التي يضطرب مخرجها عند النطق بها ساكنة',
        letters: ['ق', 'ط', 'ب', 'ج', 'د']
    },
    {
        id: 'isti-laa',
        title: 'حروف الاستعلاء والتفخيم (خص ضغط قظ)',
        badge: 'تفخيم',
        category: 'tajweed',
        description: 'الحروف المفخمة دائماً التي يستعلي بها اللسان إلى الحنك الأعلى',
        letters: ['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ']
    },
    {
        id: 'safeer',
        title: 'حروف الصفير (ص، س، ز)',
        badge: 'صفير',
        category: 'tajweed',
        description: 'حروف يخرج معها صوت يشبه صفير الطائر',
        letters: ['ص', 'س', 'ز']
    },
    {
        id: 'shafatan',
        title: 'حروف الشفتين (ف، و، ب، م)',
        badge: 'شفوية',
        category: 'tajweed',
        description: 'الحروف التي مخرجها من الشفتين معاً أو بطن الشفة',
        letters: ['ف', 'و', 'ب', 'م']
    },
    {
        id: 'jowf-madd',
        title: 'حروف المد واللين (ا، و، ي)',
        badge: 'مد ولين',
        category: 'tajweed',
        description: 'حروف الألف والواو والياء السواكن',
        letters: ['ا', 'و', 'ي']
    },
    {
        id: 'hams',
        title: 'حروف الهمس (فحثه شخص سكت)',
        badge: 'همس',
        category: 'tajweed',
        description: 'الحروف التي يجري معها النفس عند النطق بها',
        letters: ['ف', 'ح', 'ث', 'ه', 'ش', 'خ', 'ص', 'س', 'ك', 'ت']
    },
    {
        id: 'thalq',
        title: 'الحروف الذلقية (فر من لب)',
        badge: 'ذلاقة',
        category: 'tajweed',
        description: 'الحروف الخفيفة سريعة النطق الخارجة من ذلق اللسان أو الشفة',
        letters: ['ف', 'ر', 'م', 'ن', 'ل', 'ب']
    },
    // Linguistic
    {
        id: 'shamsi',
        title: 'الحروف الشمسية (14 حرفاً)',
        badge: 'شمسية',
        category: 'linguistic',
        description: 'الحروف التي تدغم معها لام التعريف',
        letters: ARABIC_LETTERS_META.filter(l => l.isShamsi).map(l => l.char)
    },
    {
        id: 'qamari',
        title: 'الحروف القمرية (14 حرفاً)',
        badge: 'قمرية',
        category: 'linguistic',
        description: 'الحروف التي تظهر معها لام التعريف (ابغ حجك وخف عقيمه)',
        letters: ARABIC_LETTERS_META.filter(l => !l.isShamsi).map(l => l.char)
    },
    // Specific Fawatih
    {
        id: 'fawatih-hm',
        title: 'فواتح آل حـم (ح، م)',
        badge: 'حم',
        category: 'fawatih',
        description: 'الحروف المشكلة لفواتح سور الحواميم السبع المتتالية',
        letters: ['ح', 'م']
    },
    {
        id: 'fawatih-alm',
        title: 'فواتح الم (ا، ل، م)',
        badge: 'الم',
        category: 'fawatih',
        description: 'الحروف الثلاثة الأكثر تكراراً في فواتح السور',
        letters: ['ا', 'ل', 'م']
    },
    {
        id: 'fawatih-alr',
        title: 'فواتح الر (ا، ل، ر)',
        badge: 'الر',
        category: 'fawatih',
        description: 'فواتح سور يونس، هود، يوسف، إبراهيم، الحجر',
        letters: ['ا', 'ل', 'ر']
    },
    {
        id: 'fawatih-khyas',
        title: 'فاتحة كهيعص (ك، ه، ي، ع، ص)',
        badge: 'كهيعص',
        category: 'fawatih',
        description: 'الحروف الخمسة الفريدة لفاتحة سورة مريم',
        letters: ['ك', 'ه', 'ي', 'ع', 'ص']
    },
    {
        id: 'fawatih-tsm',
        title: 'فواتح طسم / طس (ط، س، م)',
        badge: 'طسم',
        category: 'fawatih',
        description: 'فواتح سور الشعراء، النمل، القصص',
        letters: ['ط', 'س', 'م']
    }
];

export type MatchingMode = 'pure_or_purity' | 'must_contain_all' | 'zero_occurrences';

export interface ScanWordBreakdown {
    wordOriginal: string;
    wordNormalized: string;
    isMatched: boolean;
    totalLetters: number;
    matchedLettersCount: number;
    unmatchedLetters: string[];
}

export interface MatchedAyahResult {
    surahNumber: number;
    ayahNumberInSurah: number;
    ayahNumberGlobal: number;
    surahName: string;
    textOriginal: string;
    textNormalized: string;
    totalLetters: number;
    matchedLettersCount: number;
    purityPercentage: number;
    isPure: boolean;
    isFawatihAyah: boolean;
    containsAllSelected: boolean;
    hasZeroSelected: boolean;
    matchedLettersSet: string[];
    missingSelectedLetters: string[];
    unmatchedLettersInAyah: string[];
    words: ScanWordBreakdown[];
    longestMatchedWordStreak: number;
}

export interface ScanProgressState {
    isScanning: boolean;
    percent: number;
    currentSurahNumber: number;
    currentSurahName: string;
    totalSurahs: number;
    scannedAyahsCount: number;
    totalAyahsCount: number;
    matchedAyahsCount: number;
    elapsedMs: number;
}

export interface ScanSummaryStats {
    totalAyahsScanned: number;
    matchedAyahsCount: number;
    pureAyahsCount: number;
    totalWordsCount: number;
    matchedWordsCount: number;
    surahsWithMatchesCount: number;
    averagePurity: number;
    letterFrequencyInMatched: { [letter: string]: number };
    surahDistribution: { surahNumber: number; surahName: string; matchCount: number; totalAyahs: number }[];
    longestWordStreakItem?: MatchedAyahResult;
}

// Pre-calculated ayah character cache to optimize performance across repeated scans
interface AyahPrecalculatedData {
    surahNumber: number;
    ayahNumberInSurah: number;
    ayahNumberGlobal: number;
    surahName: string;
    textOriginal: string;
    textNormalized: string;
    normalizedChars: string[];
    uniqueCharSet: Set<string>;
    words: { original: string; normalized: string; chars: string[]; uniqueCharSet: Set<string> }[];
    isFawatihAyah: boolean;
}

let quranAyahsCache: AyahPrecalculatedData[] | null = null;

export interface IndexProgressState {
    isIndexing: boolean;
    percent: number;
    currentSurahNumber: number;
    currentSurahName: string;
    indexedAyahsCount: number;
    totalAyahsCount: number;
}

export function isAyahIndexReady(): boolean {
    return quranAyahsCache !== null && quranAyahsCache.length > 6000;
}

/**
 * Progressively indexes Quran ayahs in non-blocking chunks without freezing the browser
 */
export function ensureAyahIndexAsync(
    simpleCleanData: SurahData[],
    onProgress: (state: IndexProgressState) => void,
    onComplete: (data: AyahPrecalculatedData[]) => void
): () => void {
    if (quranAyahsCache && quranAyahsCache.length > 6000) {
        onProgress({
            isIndexing: false,
            percent: 100,
            currentSurahNumber: 114,
            currentSurahName: 'الناس',
            indexedAyahsCount: quranAyahsCache.length,
            totalAyahsCount: quranAyahsCache.length
        });
        onComplete(quranAyahsCache);
        return () => {};
    }

    let isCancelled = false;
    const cache: AyahPrecalculatedData[] = [];
    const FAWATIH_SURAHS = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);
    
    let totalAyahsInQuran = 0;
    for (const s of simpleCleanData) {
        totalAyahsInQuran += s.ayahs.length;
    }
    if (totalAyahsInQuran === 0) totalAyahsInQuran = 6236;

    let surahIdx = 0;
    const SURAHS_PER_TICK = 6; // Process 6 surahs per tick to yield to browser UI

    function processSurahsChunk() {
        if (isCancelled) return;

        const endIdx = Math.min(surahIdx + SURAHS_PER_TICK, simpleCleanData.length);
        for (let sI = surahIdx; sI < endIdx; sI++) {
            const surah = simpleCleanData[sI];
            if (!surah) continue;

            for (const ayah of surah.ayahs) {
                const textOrig = ayah.text;
                const textNorm = normalizeArabicText(textOrig);
                const wordsRaw = textOrig.split(/\s+/).filter(Boolean);
                
                const words = wordsRaw.map(w => {
                    const wNorm = normalizeArabicText(w);
                    const chars: string[] = [];
                    const charSet = new Set<string>();
                    for (let i = 0; i < wNorm.length; i++) {
                        const ch = normalizeCharForNoorani(wNorm[i]);
                        if (ch && /[\u0621-\u064A]/.test(ch)) {
                            chars.push(ch);
                            charSet.add(ch);
                        }
                    }
                    return { original: w, normalized: wNorm, chars, uniqueCharSet: charSet };
                });

                const normChars: string[] = [];
                const uniqueSet = new Set<string>();
                for (const w of words) {
                    for (const ch of w.chars) {
                        normChars.push(ch);
                        uniqueSet.add(ch);
                    }
                }

                const isFawatihAyah = FAWATIH_SURAHS.has(surah.number) && ayah.numberInSurah === 1 && normChars.length <= 6;

                cache.push({
                    surahNumber: surah.number,
                    ayahNumberInSurah: ayah.numberInSurah,
                    ayahNumberGlobal: ayah.number,
                    surahName: surah.name,
                    textOriginal: textOrig,
                    textNormalized: textNorm,
                    normalizedChars: normChars,
                    uniqueCharSet: uniqueSet,
                    words,
                    isFawatihAyah
                });
            }
        }

        surahIdx = endIdx;
        const currentSurah = simpleCleanData[Math.min(surahIdx, simpleCleanData.length - 1)];
        const percent = Math.min(100, Math.round((cache.length / totalAyahsInQuran) * 100));

        onProgress({
            isIndexing: surahIdx < simpleCleanData.length,
            percent,
            currentSurahNumber: currentSurah ? currentSurah.number : 114,
            currentSurahName: currentSurah ? currentSurah.name : 'الناس',
            indexedAyahsCount: cache.length,
            totalAyahsCount: totalAyahsInQuran
        });

        if (surahIdx < simpleCleanData.length) {
            setTimeout(processSurahsChunk, 2);
        } else {
            quranAyahsCache = cache;
            onComplete(cache);
        }
    }

    setTimeout(processSurahsChunk, 0);

    return () => {
        isCancelled = true;
    };
}

export function buildAyahIndex(simpleCleanData: SurahData[]): AyahPrecalculatedData[] {
    if (quranAyahsCache && quranAyahsCache.length > 6000) {
        return quranAyahsCache;
    }

    const cache: AyahPrecalculatedData[] = [];
    const FAWATIH_SURAHS = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);

    for (const surah of simpleCleanData) {
        for (const ayah of surah.ayahs) {
            const textOrig = ayah.text;
            const textNorm = normalizeArabicText(textOrig);
            const wordsRaw = textOrig.split(/\s+/).filter(Boolean);
            
            const words = wordsRaw.map(w => {
                const wNorm = normalizeArabicText(w);
                const chars: string[] = [];
                const charSet = new Set<string>();
                for (let i = 0; i < wNorm.length; i++) {
                    const ch = normalizeCharForNoorani(wNorm[i]);
                    if (ch && /[\u0621-\u064A]/.test(ch)) {
                        chars.push(ch);
                        charSet.add(ch);
                    }
                }
                return { original: w, normalized: wNorm, chars, uniqueCharSet: charSet };
            });

            const normChars: string[] = [];
            const uniqueSet = new Set<string>();
            for (const w of words) {
                for (const ch of w.chars) {
                    normChars.push(ch);
                    uniqueSet.add(ch);
                }
            }

            const isFawatihAyah = FAWATIH_SURAHS.has(surah.number) && ayah.numberInSurah === 1 && normChars.length <= 6;

            cache.push({
                surahNumber: surah.number,
                ayahNumberInSurah: ayah.numberInSurah,
                ayahNumberGlobal: ayah.number,
                surahName: surah.name,
                textOriginal: textOrig,
                textNormalized: textNorm,
                normalizedChars: normChars,
                uniqueCharSet: uniqueSet,
                words,
                isFawatihAyah
            });
        }
    }

    quranAyahsCache = cache;
    return cache;
}

export interface ScanOptions {
    selectedLetters: string[];
    matchingMode: MatchingMode;
    purityThreshold: number; // e.g. 100 for pure, 90, 80...
    excludeFawatih: boolean;
    surahScope: 'all' | 'fawatih_surahs' | 'meccan' | 'medinan' | 'single_surah';
    selectedSurahNumber?: number;
    meccanSurahsSet?: Set<number>;
}

/**
 * Executes a chunked scan of the entire Quran with async progress reporting
 */
export function executeChunkedAlphabetScan(
    simpleCleanData: SurahData[],
    options: ScanOptions,
    onProgress: (state: ScanProgressState) => void,
    onComplete: (results: MatchedAyahResult[], stats: ScanSummaryStats) => void
): () => void {
    let isCancelled = false;
    const startTime = performance.now();

    const ayahsData = buildAyahIndex(simpleCleanData);
    const totalAyahs = ayahsData.length;
    const selectedLettersSet = new Set(options.selectedLetters.map(l => normalizeCharForNoorani(l)));
    const selectedLettersList = Array.from(selectedLettersSet);

    const matchedResults: MatchedAyahResult[] = [];
    const letterFreq: { [l: string]: number } = {};
    for (const meta of ARABIC_LETTERS_META) {
        letterFreq[meta.char] = 0;
    }

    const surahDistMap = new Map<number, { surahName: string; matchCount: number; totalAyahs: number }>();
    for (const surah of simpleCleanData) {
        surahDistMap.set(surah.number, { surahName: surah.name, matchCount: 0, totalAyahs: surah.ayahs.length });
    }

    let pureCount = 0;
    let totalMatchedWords = 0;
    let totalAllWords = 0;
    let totalPuritySum = 0;

    const FAWATIH_SURAHS = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);

    const CHUNK_SIZE = 400; // Scan 400 ayahs per tick to allow UI to breathe and show the progress bar
    let currentIndex = 0;

    function processNextChunk() {
        if (isCancelled) return;

        const chunkEnd = Math.min(currentIndex + CHUNK_SIZE, totalAyahs);
        for (let i = currentIndex; i < chunkEnd; i++) {
            const item = ayahsData[i];

            // Filter by Surah Scope
            if (options.surahScope === 'single_surah' && options.selectedSurahNumber) {
                if (item.surahNumber !== options.selectedSurahNumber) continue;
            } else if (options.surahScope === 'fawatih_surahs') {
                if (!FAWATIH_SURAHS.has(item.surahNumber)) continue;
            }

            // Exclude Fawatih opening verses if requested
            if (options.excludeFawatih && item.isFawatihAyah) {
                continue;
            }

            // Check matching based on selected mode
            const totalChars = item.normalizedChars.length;
            if (totalChars === 0) continue;

            let matchedCharsCount = 0;
            const unmatchedLettersInAyahSet = new Set<string>();

            for (const ch of item.normalizedChars) {
                if (selectedLettersSet.has(ch)) {
                    matchedCharsCount++;
                } else {
                    unmatchedLettersInAyahSet.add(ch);
                }
            }

            const purity = Math.round((matchedCharsCount / totalChars) * 100);
            const isPure = purity === 100;

            // Check if contains all selected letters
            let containsAll = true;
            const missingLetters: string[] = [];
            for (const reqLetter of selectedLettersList) {
                if (!item.uniqueCharSet.has(reqLetter)) {
                    containsAll = false;
                    missingLetters.push(reqLetter);
                }
            }

            // Check if zero occurrences of selected letters
            const hasZero = matchedCharsCount === 0;

            let isMatch = false;
            if (options.matchingMode === 'pure_or_purity') {
                isMatch = purity >= options.purityThreshold;
            } else if (options.matchingMode === 'must_contain_all') {
                isMatch = containsAll;
            } else if (options.matchingMode === 'zero_occurrences') {
                isMatch = hasZero;
            }

            if (isMatch) {
                // Breakdown words
                let longestStreak = 0;
                let currentStreak = 0;

                const wordsBreakdown: ScanWordBreakdown[] = item.words.map(w => {
                    totalAllWords++;
                    let wMatchedCount = 0;
                    const wUnmatched: string[] = [];

                    for (const ch of w.chars) {
                        if (selectedLettersSet.has(ch)) {
                            wMatchedCount++;
                        } else {
                            wUnmatched.push(ch);
                        }
                    }

                    const isWordMatch = w.chars.length > 0 && wMatchedCount === w.chars.length;
                    if (isWordMatch) {
                        currentStreak++;
                        if (currentStreak > longestStreak) longestStreak = currentStreak;
                        totalMatchedWords++;
                    } else {
                        currentStreak = 0;
                    }

                    return {
                        wordOriginal: w.original,
                        wordNormalized: w.normalized,
                        isMatched: isWordMatch,
                        totalLetters: w.chars.length,
                        matchedLettersCount: wMatchedCount,
                        unmatchedLetters: Array.from(new Set(wUnmatched))
                    };
                });

                if (isPure) pureCount++;
                totalPuritySum += purity;

                // Update frequency counts
                for (const ch of item.normalizedChars) {
                    if (letterFreq[ch] !== undefined) {
                        letterFreq[ch]++;
                    }
                }

                // Surah distribution
                const sDist = surahDistMap.get(item.surahNumber);
                if (sDist) {
                    sDist.matchCount++;
                }

                matchedResults.push({
                    surahNumber: item.surahNumber,
                    ayahNumberInSurah: item.ayahNumberInSurah,
                    ayahNumberGlobal: item.ayahNumberGlobal,
                    surahName: item.surahName,
                    textOriginal: item.textOriginal,
                    textNormalized: item.textNormalized,
                    totalLetters: totalChars,
                    matchedLettersCount: matchedCharsCount,
                    purityPercentage: purity,
                    isPure,
                    isFawatihAyah: item.isFawatihAyah,
                    containsAllSelected: containsAll,
                    hasZeroSelected: hasZero,
                    matchedLettersSet: Array.from(item.uniqueCharSet).filter(c => selectedLettersSet.has(c)),
                    missingSelectedLetters: missingLetters,
                    unmatchedLettersInAyah: Array.from(unmatchedLettersInAyahSet),
                    words: wordsBreakdown,
                    longestMatchedWordStreak: longestStreak
                });
            }
        }

        currentIndex = chunkEnd;
        const currentItem = ayahsData[Math.min(currentIndex, totalAyahs - 1)];
        const progressPercent = Math.min(100, Math.round((currentIndex / totalAyahs) * 100));

        onProgress({
            isScanning: currentIndex < totalAyahs,
            percent: progressPercent,
            currentSurahNumber: currentItem?.surahNumber || 114,
            currentSurahName: currentItem?.surahName || '',
            totalSurahs: 114,
            scannedAyahsCount: currentIndex,
            totalAyahsCount: totalAyahs,
            matchedAyahsCount: matchedResults.length,
            elapsedMs: Math.round(performance.now() - startTime)
        });

        if (currentIndex < totalAyahs) {
            // Schedule next frame / chunk
            setTimeout(processNextChunk, 0);
        } else {
            // Finished
            const surahDistArray = Array.from(surahDistMap.entries())
                .filter(([_, data]) => data.matchCount > 0)
                .map(([surahNumber, data]) => ({
                    surahNumber,
                    surahName: data.surahName,
                    matchCount: data.matchCount,
                    totalAyahs: data.totalAyahs
                }))
                .sort((a, b) => b.matchCount - a.matchCount);

            // Sort matched results by highest purity, then by Quranic order
            matchedResults.sort((a, b) => {
                if (options.matchingMode === 'pure_or_purity') {
                    if (b.purityPercentage !== a.purityPercentage) {
                        return b.purityPercentage - a.purityPercentage;
                    }
                }
                return a.ayahNumberGlobal - b.ayahNumberGlobal;
            });

            // Find longest streak
            let longestWordStreakItem: MatchedAyahResult | undefined;
            let maxStreak = 0;
            for (const res of matchedResults) {
                if (res.longestMatchedWordStreak > maxStreak) {
                    maxStreak = res.longestMatchedWordStreak;
                    longestWordStreakItem = res;
                }
            }

            const stats: ScanSummaryStats = {
                totalAyahsScanned: totalAyahs,
                matchedAyahsCount: matchedResults.length,
                pureAyahsCount: pureCount,
                totalWordsCount: totalAllWords,
                matchedWordsCount: totalMatchedWords,
                surahsWithMatchesCount: surahDistArray.length,
                averagePurity: matchedResults.length > 0 ? Math.round(totalPuritySum / matchedResults.length) : 0,
                letterFrequencyInMatched: letterFreq,
                surahDistribution: surahDistArray,
                longestWordStreakItem
            };

            onComplete(matchedResults, stats);
        }
    }

    // Start immediately
    setTimeout(processNextChunk, 0);

    return () => {
        isCancelled = true;
    };
}
