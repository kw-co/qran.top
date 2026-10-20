import type { SurahData } from '../types';
import { normalizeArabicText, stripDiacritics } from './text';

export const ALL_ARABIC_LETTERS = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 
    'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 
    'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 
    'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
] as const;

export type ArabicLetter = typeof ALL_ARABIC_LETTERS[number];

export const POPULAR_BALANCE_LETTERS = ['tri-madd', 'و', 'ا', 'ي'] as const;

export const ARABIC_LETTER_NAMES: Record<string, string> = {
    'tri-madd': 'أحرف المد الثلاثة (و، ا، ي)',
    'ا': 'الألف',
    'ب': 'الباء',
    'ت': 'التاء',
    'ث': 'الثاء',
    'ج': 'الجيم',
    'ح': 'الحاء',
    'خ': 'الخاء',
    'د': 'الدال',
    'ذ': 'الذال',
    'ر': 'الراء',
    'ز': 'الزاي',
    'س': 'السين',
    'ش': 'الشين',
    'ص': 'الصاد',
    'ض': 'الضاد',
    'ط': 'الطاء',
    'ظ': 'الظاء',
    'ع': 'العين',
    'غ': 'الغين',
    'ف': 'الفاء',
    'ق': 'القاف',
    'ك': 'الكاف',
    'ل': 'اللام',
    'م': 'الميم',
    'ن': 'النون',
    'ه': 'الهاء',
    'و': 'الواو',
    'ي': 'الياء'
};

export const CANONICAL_14_NOORANI = [
    'ا', 'ح', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'ي'
] as const;

export type NooraniChar = typeof CANONICAL_14_NOORANI[number];

export const NOORANI_SET = new Set<string>(CANONICAL_14_NOORANI);

export const NOORANI_NAMES: Record<string, string> = {
    'ا': 'الألف',
    'ح': 'الحاء',
    'ر': 'الراء',
    'س': 'السين',
    'ص': 'الصاد',
    'ط': 'الطاء',
    'ع': 'العين',
    'ق': 'القاف',
    'ك': 'الكاف',
    'ل': 'اللام',
    'م': 'الميم',
    'ن': 'النون',
    'ه': 'الهاء',
    'ي': 'الياء'
};

export interface WawVerseOccurrence {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    globalAyahNumber?: number;
    ayahText: string;
    matchedWord: string;
}

export interface WawWordMatch {
    word: string; // The exact or cleaned word (e.g. 'هود', 'قال', 'دين')
    originalToken: string; // The token as it appeared in verse
    firstLetter: string; // L1
    middleLetter: string; // Fulcrum letter (e.g. 'و', 'ا', 'ي'...)
    secondLetter: string; // L2
    equation: string; // e.g. 'ه = د'
    frequency: number;
    occurrences: WawVerseOccurrence[];
}

export interface WawEquation {
    id: string; // e.g. 'ه=د'
    leftLetter: string; // L1
    rightLetter: string; // L2
    isLeftNoorani: boolean;
    isRightNoorani: boolean;
    relationType: 'noorani-noorani' | 'noorani-dhulmani' | 'dhulmani-noorani' | 'dhulmani-dhulmani';
    words: {
        word: string;
        frequency: number;
        occurrences: WawVerseOccurrence[];
    }[];
    totalOccurrences: number;
    isSymmetric: boolean; // Does rightLetter = leftLetter also exist?
    isSelfBalance: boolean; // leftLetter === rightLetter
    reverseEquationId?: string; // e.g. 'د=ه'
}

export interface NooraniPartnerDetail {
    partnerLetter: string;
    isPartnerNoorani: boolean;
    words: {
        word: string;
        frequency: number;
        equation: string;
        occurrences: WawVerseOccurrence[];
    }[];
    totalOccurrences: number;
    equations: string[]; // e.g. ['ه = د']
    direction: 'left' | 'right' | 'both'; // Whether Noorani is L1, L2, or appears in both
}

export interface NooraniWawSummary {
    nooraniLetter: string;
    nooraniName: string;
    partnerLetters: NooraniPartnerDetail[];
    totalPartnersCount: number;
    nooraniPartnersCount: number;
    dhulmaniPartnersCount: number;
    totalWordOccurrences: number;
    wordsList: string[];
}

export interface MizanWawAnalysisResult {
    balanceLetter: string; // The fulcrum letter (e.g. 'و', 'ا', 'ي'...)
    balanceLetterName: string; // e.g. 'الواو', 'الألف', 'الياء'...
    allWords: WawWordMatch[];
    allEquations: WawEquation[];
    nooraniSummaries: Record<string, NooraniWawSummary>;
    nooraniSummariesList: NooraniWawSummary[];
    symmetricPairs: {
        equationA: WawEquation;
        equationB: WawEquation;
        pairKey: string;
    }[];
    selfBalancedWords: WawWordMatch[];
    stats: {
        totalUniqueWords: number;
        totalWordOccurrences: number;
        totalUniqueEquations: number;
        nooraniNooraniEquations: number;
        nooraniDhulmaniEquations: number;
        dhulmaniDhulmaniEquations: number;
        symmetricPairsCount: number;
        selfBalancedCount: number;
    };
}

/**
 * Normalizes a raw word for 3-letter balance analysis around any selected middle letter:
 * - Strips all harakat and tashkeel.
 * - Retains base Arabic letters.
 * - Optionally handles accusative tanween alif at the end (e.g. هوداً -> هود، قالاً -> قال).
 */
export function normalizeWawWordCandidate(raw: string, balanceLetter: string = 'و'): {
    cleanWord: string;
    letters: string[];
    isExactThree: boolean;
    hasTanweenAlif: boolean;
} | null {
    if (!raw) return null;

    // Remove tashkeel, pause marks, dagger alifs
    let stripped = raw
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/ـ/g, '')
        .replace(/[^\u0621-\u064A\u0671]/g, '')
        .trim();

    if (!stripped) return null;

    // Normalizations for consistent letter identity:
    // Alif variants: أ إ آ ٱ -> ا
    stripped = stripped.replace(/[أإآٱ]/g, 'ا');
    // Alef maksura -> ي
    stripped = stripped.replace(/ى/g, 'ي');
    // Teh marbuta -> ه
    stripped = stripped.replace(/ة/g, 'ه');

    const chars = Array.from(stripped);

    const isTriMadd = balanceLetter === 'tri-madd' || balanceLetter === 'مد';
    const matchesBalance = (char: string) => isTriMadd ? (char === 'و' || char === 'ا' || char === 'ي') : (char === balanceLetter);

    // Exact 3 letters with middle balanceLetter: L1 + balanceLetter + L2
    if (chars.length === 3 && matchesBalance(chars[1])) {
        return {
            cleanWord: stripped,
            letters: chars,
            isExactThree: true,
            hasTanweenAlif: false
        };
    }

    // 4 letters where the last is tanween Alif: L1 + balanceLetter + L2 + 'ا'
    if (chars.length === 4 && matchesBalance(chars[1]) && chars[3] === 'ا') {
        const baseThree = [chars[0], chars[1], chars[2]];
        return {
            cleanWord: baseThree.join(''),
            letters: baseThree,
            isExactThree: false,
            hasTanweenAlif: true
        };
    }

    return null;
}

// Memory cache for instantaneous re-renders across all letters
const analysisCacheMap = new Map<string, MizanWawAnalysisResult>();
let cachedDataRef: SurahData[] | null = null;

export interface MizanWawOptions {
    balanceLetter?: string;
    includeTanweenAlif?: boolean;
}

/**
 * Scans all Quranic surahs and extracts every 3-letter word with balanceLetter in the middle,
 * formulating the Balance (L1 = L2) and aggregating partners for each Noorani letter.
 */
export function analyzeMizanWaw(
    simpleCleanData: SurahData[],
    options: MizanWawOptions = {}
): MizanWawAnalysisResult {
    const balanceLetter = options.balanceLetter || 'و';
    const balanceLetterName = ARABIC_LETTER_NAMES[balanceLetter] || balanceLetter;
    const includeTanween = options.includeTanweenAlif !== false;

    if (cachedDataRef !== simpleCleanData) {
        analysisCacheMap.clear();
        cachedDataRef = simpleCleanData;
    }

    const cacheKey = `${balanceLetter}_${includeTanween}`;
    if (analysisCacheMap.has(cacheKey)) {
        return analysisCacheMap.get(cacheKey)!;
    }

    const wordsMap = new Map<string, {
        word: string;
        firstLetter: string;
        middleLetter: string;
        secondLetter: string;
        equation: string;
        frequency: number;
        occurrences: WawVerseOccurrence[];
    }>();

    if (simpleCleanData && simpleCleanData.length > 0) {
        for (let sIdx = 0; sIdx < simpleCleanData.length; sIdx++) {
            const surah = simpleCleanData[sIdx];
            const surahNumber = surah.number;
            const surahName = surah.name;

            for (let aIdx = 0; aIdx < surah.ayahs.length; aIdx++) {
                const ayah = surah.ayahs[aIdx];
                const rawTokens = ayah.text.split(/\s+/);

                for (let tIdx = 0; tIdx < rawTokens.length; tIdx++) {
                    const rawToken = rawTokens[tIdx];
                    const candidate = normalizeWawWordCandidate(rawToken, balanceLetter);

                    if (!candidate) continue;
                    if (!includeTanween && candidate.hasTanweenAlif) continue;

                    const clean = candidate.cleanWord;
                    const L1 = candidate.letters[0];
                    const midLetter = candidate.letters[1];
                    const L2 = candidate.letters[2];
                    const equation = `${L1} = ${L2}`;

                    const occurrence: WawVerseOccurrence = {
                        surahNumber,
                        surahName,
                        ayahNumber: ayah.numberInSurah,
                        globalAyahNumber: ayah.number,
                        ayahText: ayah.text,
                        matchedWord: clean
                    };

                    const existing = wordsMap.get(clean);
                    if (existing) {
                        existing.frequency += 1;
                        existing.occurrences.push(occurrence);
                    } else {
                        wordsMap.set(clean, {
                            word: clean,
                            firstLetter: L1,
                            middleLetter: midLetter,
                            secondLetter: L2,
                            equation,
                            frequency: 1,
                            occurrences: [occurrence]
                        });
                    }
                }
            }
        }
    }

    // Convert map to array
    const allWords: WawWordMatch[] = Array.from(wordsMap.values()).map(w => ({
        word: w.word,
        originalToken: w.word,
        firstLetter: w.firstLetter,
        middleLetter: (w as any).middleLetter || balanceLetter,
        secondLetter: w.secondLetter,
        equation: w.equation,
        frequency: w.frequency,
        occurrences: w.occurrences
    }));

    // Sort words by frequency descending
    allWords.sort((a, b) => b.frequency - a.frequency);

    // Group into Equations: L1 = L2
    const equationsMap = new Map<string, {
        id: string;
        leftLetter: string;
        rightLetter: string;
        words: Map<string, { word: string; frequency: number; occurrences: WawVerseOccurrence[] }>;
        totalOccurrences: number;
    }>();

    for (const w of allWords) {
        const eqId = `${w.firstLetter}=${w.secondLetter}`;
        let eq = equationsMap.get(eqId);
        if (!eq) {
            eq = {
                id: eqId,
                leftLetter: w.firstLetter,
                rightLetter: w.secondLetter,
                words: new Map(),
                totalOccurrences: 0
            };
            equationsMap.set(eqId, eq);
        }

        eq.totalOccurrences += w.frequency;
        const wEntry = eq.words.get(w.word);
        if (wEntry) {
            wEntry.frequency += w.frequency;
            wEntry.occurrences.push(...w.occurrences);
        } else {
            eq.words.set(w.word, {
                word: w.word,
                frequency: w.frequency,
                occurrences: [...w.occurrences]
            });
        }
    }

    // Build finalized equations list with symmetry checks
    const allEquations: WawEquation[] = [];
    const eqKeysSet = new Set(equationsMap.keys());

    for (const [eqId, eq] of equationsMap.entries()) {
        const leftIsNoorani = NOORANI_SET.has(eq.leftLetter);
        const rightIsNoorani = NOORANI_SET.has(eq.rightLetter);

        let relationType: WawEquation['relationType'];
        if (leftIsNoorani && rightIsNoorani) relationType = 'noorani-noorani';
        else if (leftIsNoorani && !rightIsNoorani) relationType = 'noorani-dhulmani';
        else if (!leftIsNoorani && rightIsNoorani) relationType = 'dhulmani-noorani';
        else relationType = 'dhulmani-dhulmani';

        const reverseId = `${eq.rightLetter}=${eq.leftLetter}`;
        const isSymmetric = eq.leftLetter !== eq.rightLetter && eqKeysSet.has(reverseId);
        const isSelfBalance = eq.leftLetter === eq.rightLetter;

        allEquations.push({
            id: eqId,
            leftLetter: eq.leftLetter,
            rightLetter: eq.rightLetter,
            isLeftNoorani: leftIsNoorani,
            isRightNoorani: rightIsNoorani,
            relationType,
            words: Array.from(eq.words.values()).sort((a, b) => b.frequency - a.frequency),
            totalOccurrences: eq.totalOccurrences,
            isSymmetric,
            isSelfBalance,
            reverseEquationId: isSymmetric ? reverseId : undefined
        });
    }

    allEquations.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

    // Grouping by each of the 14 Noorani letters
    const nooraniSummaries: Record<string, NooraniWawSummary> = {};

    for (const nLetter of CANONICAL_14_NOORANI) {
        const partnersMap = new Map<string, {
            partnerLetter: string;
            isPartnerNoorani: boolean;
            words: Map<string, { word: string; frequency: number; equation: string; occurrences: WawVerseOccurrence[] }>;
            totalOccurrences: number;
            equations: Set<string>;
            directionSet: Set<'left' | 'right'>;
        }>();

        // Scan all equations involving nLetter
        for (const eq of allEquations) {
            let partner: string | null = null;
            let dir: 'left' | 'right' | null = null;

            if (eq.leftLetter === nLetter) {
                partner = eq.rightLetter;
                dir = 'left';
            } else if (eq.rightLetter === nLetter) {
                partner = eq.leftLetter;
                dir = 'right';
            }

            if (!partner || !dir) continue;

            let pEntry = partnersMap.get(partner);
            if (!pEntry) {
                pEntry = {
                    partnerLetter: partner,
                    isPartnerNoorani: NOORANI_SET.has(partner),
                    words: new Map(),
                    totalOccurrences: 0,
                    equations: new Set(),
                    directionSet: new Set()
                };
                partnersMap.set(partner, pEntry);
            }

            pEntry.totalOccurrences += eq.totalOccurrences;
            pEntry.equations.add(`${eq.leftLetter} = ${eq.rightLetter}`);
            pEntry.directionSet.add(dir);

            for (const w of eq.words) {
                const existingW = pEntry.words.get(w.word);
                if (existingW) {
                    existingW.frequency += w.frequency;
                    existingW.occurrences.push(...w.occurrences);
                } else {
                    pEntry.words.set(w.word, {
                        word: w.word,
                        frequency: w.frequency,
                        equation: `${eq.leftLetter} = ${eq.rightLetter}`,
                        occurrences: [...w.occurrences]
                    });
                }
            }
        }

        const partnersList: NooraniPartnerDetail[] = Array.from(partnersMap.values()).map(p => {
            let direction: NooraniPartnerDetail['direction'] = 'both';
            if (p.directionSet.has('left') && !p.directionSet.has('right')) direction = 'left';
            else if (!p.directionSet.has('left') && p.directionSet.has('right')) direction = 'right';

            return {
                partnerLetter: p.partnerLetter,
                isPartnerNoorani: p.isPartnerNoorani,
                words: Array.from(p.words.values()).sort((a, b) => b.frequency - a.frequency),
                totalOccurrences: p.totalOccurrences,
                equations: Array.from(p.equations),
                direction
            };
        });

        partnersList.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

        const nooraniPartnersCount = partnersList.filter(p => p.isPartnerNoorani).length;
        const dhulmaniPartnersCount = partnersList.filter(p => !p.isPartnerNoorani).length;
        const totalWordOccurrences = partnersList.reduce((acc, p) => acc + p.totalOccurrences, 0);

        // Collect distinct words
        const wordsSet = new Set<string>();
        partnersList.forEach(p => p.words.forEach(w => wordsSet.add(w.word)));

        nooraniSummaries[nLetter] = {
            nooraniLetter: nLetter,
            nooraniName: NOORANI_NAMES[nLetter] || nLetter,
            partnerLetters: partnersList,
            totalPartnersCount: partnersList.length,
            nooraniPartnersCount,
            dhulmaniPartnersCount,
            totalWordOccurrences,
            wordsList: Array.from(wordsSet)
        };
    }

    const nooraniSummariesList = CANONICAL_14_NOORANI.map(char => nooraniSummaries[char]);

    // Build symmetric pairs list (A = B and B = A)
    const symmetricPairs: MizanWawAnalysisResult['symmetricPairs'] = [];
    const processedPairs = new Set<string>();

    for (const eq of allEquations) {
        if (!eq.isSymmetric || !eq.reverseEquationId) continue;
        const sortedPairKey = [eq.leftLetter, eq.rightLetter].sort().join('=');
        if (processedPairs.has(sortedPairKey)) continue;

        const revEq = allEquations.find(e => e.id === eq.reverseEquationId);
        if (revEq) {
            symmetricPairs.push({
                equationA: eq,
                equationB: revEq,
                pairKey: sortedPairKey
            });
            processedPairs.add(sortedPairKey);
        }
    }

    symmetricPairs.sort((a, b) => (b.equationA.totalOccurrences + b.equationB.totalOccurrences) - (a.equationA.totalOccurrences + a.equationB.totalOccurrences));

    // Self balanced words (L1 = L1)
    const selfBalancedWords = allWords.filter(w => w.firstLetter === w.secondLetter);

    // Compute metrics
    const stats: MizanWawAnalysisResult['stats'] = {
        totalUniqueWords: allWords.length,
        totalWordOccurrences: allWords.reduce((acc, w) => acc + w.frequency, 0),
        totalUniqueEquations: allEquations.length,
        nooraniNooraniEquations: allEquations.filter(e => e.relationType === 'noorani-noorani').length,
        nooraniDhulmaniEquations: allEquations.filter(e => e.relationType === 'noorani-dhulmani' || e.relationType === 'dhulmani-noorani').length,
        dhulmaniDhulmaniEquations: allEquations.filter(e => e.relationType === 'dhulmani-dhulmani').length,
        symmetricPairsCount: symmetricPairs.length,
        selfBalancedCount: selfBalancedWords.length
    };

    const result: MizanWawAnalysisResult = {
        balanceLetter,
        balanceLetterName,
        allWords,
        allEquations,
        nooraniSummaries,
        nooraniSummariesList,
        symmetricPairs,
        selfBalancedWords,
        stats
    };

    analysisCacheMap.set(cacheKey, result);
    return result;
}

/**
 * Calculates precomputed counts of 3-letter words for each of the 28 Arabic letters
 * as a middle balance fulcrum.
 */
export function getLetterWordCounts(
    simpleCleanData: SurahData[],
    includeTanweenAlif: boolean = true
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const char of ALL_ARABIC_LETTERS) {
        counts[char] = 0;
    }
    counts['tri-madd'] = 0;

    if (!simpleCleanData || simpleCleanData.length === 0) return counts;

    const uniqueWordsPerLetter = new Map<string, Set<string>>();
    for (const char of ALL_ARABIC_LETTERS) {
        uniqueWordsPerLetter.set(char, new Set<string>());
    }
    const triMaddUniqueWords = new Set<string>();

    for (let sIdx = 0; sIdx < simpleCleanData.length; sIdx++) {
        const surah = simpleCleanData[sIdx];
        for (let aIdx = 0; aIdx < surah.ayahs.length; aIdx++) {
            const rawTokens = surah.ayahs[aIdx].text.split(/\s+/);
            for (let tIdx = 0; tIdx < rawTokens.length; tIdx++) {
                const raw = rawTokens[tIdx];
                if (!raw) continue;
                let stripped = raw
                    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
                    .replace(/ـ/g, '')
                    .replace(/[^\u0621-\u064A\u0671]/g, '')
                    .trim();
                if (!stripped) continue;
                stripped = stripped.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
                const chars = Array.from(stripped);
                if (chars.length === 3) {
                    const mid = chars[1];
                    const set = uniqueWordsPerLetter.get(mid);
                    if (set) set.add(stripped);
                    if (mid === 'و' || mid === 'ا' || mid === 'ي') {
                        triMaddUniqueWords.add(stripped);
                    }
                } else if (includeTanweenAlif && chars.length === 4 && chars[3] === 'ا') {
                    const mid = chars[1];
                    const set = uniqueWordsPerLetter.get(mid);
                    const cleanThree = chars.slice(0, 3).join('');
                    if (set) set.add(cleanThree);
                    if (mid === 'و' || mid === 'ا' || mid === 'ي') {
                        triMaddUniqueWords.add(cleanThree);
                    }
                }
            }
        }
    }

    for (const [char, set] of uniqueWordsPerLetter.entries()) {
        counts[char] = set.size;
    }
    counts['tri-madd'] = triMaddUniqueWords.size;

    return counts;
}

/**
 * Generates a comprehensive analytical text report across all Quranic words and Noorani letters.
 */
export function generateFullMizanWawReport(
    analysis: MizanWawAnalysisResult, 
    includeTanween: boolean = true
): string {
    const { 
        balanceLetter = 'و', 
        balanceLetterName = 'الواو',
        allWords, 
        allEquations, 
        nooraniSummariesList, 
        symmetricPairs, 
        selfBalancedWords, 
        stats 
    } = analysis;

    let out = `# مِيزَانُ ${balanceLetterName.toUpperCase()} (${balanceLetter}) فِي كَلِمَاتِ الْقُرْآنِ الْكَرِيمِ الثُّلَاثِيَّةِ\n`;
    out += `## (دراسة بنية المصحف الشريف والتناظر الحرفي حول حرف ${balanceLetterName})\n\n`;
    out += `> المنهجية: يقوم البرنامج بالبحث عن أي كلمة قرآنية ثلاثية الأحرف يكون أوسطها حرف ${balanceLetterName} (${balanceLetter}) (L1 + ${balanceLetter} + L2)، فيجعل من ${balanceLetterName} هو الميزان ونقطة التكافؤ للحرفين الجانبيين (L1 = L2) مثل: هود ⟵ هـ = د، ثم يجمع النتائج لكل حرف من الحروف النورانية الـ 14 ("نص حكيم قاطع له سر") لمعرفة كافة الأحرف التي تقابله.\n\n`;

    out += `=========================================\n`;
    out += `### أولاً: إحصائيات عامة للميزان القرآني لحرف (${balanceLetter})\n`;
    out += `=========================================\n`;
    out += `- حرف الميزان المعتمد: ${balanceLetterName} (${balanceLetter})\n`;
    out += `- إجمالي المفردات الثلاثية المختلفة: ${stats.totalUniqueWords} مفردة\n`;
    out += `- إجمالي تكرار ورود هذه المفردات في القرآن: ${stats.totalWordOccurrences} موضعاً\n`;
    out += `- إجمالي علاقات ومعادلات التوازن (L1 = L2): ${stats.totalUniqueEquations} علاقة\n`;
    out += `- علاقات نورانية خالصة (نوراني ⟷ نوراني): ${stats.nooraniNooraniEquations} علاقة\n`;
    out += `- علاقات مشتركة (نوراني ⟷ غير نوراني): ${stats.nooraniDhulmaniEquations} علاقة\n`;
    out += `- علاقات غير نورانية (غير نوراني ⟷ غير نوراني): ${stats.dhulmaniDhulmaniEquations} علاقة\n`;
    out += `- الأزواج المتناظرة عكوسياً (A=B و B=A): ${stats.symmetricPairsCount} زوجاً\n`;
    out += `- المفردات ذات الميزان الذاتي (L1 = L1): ${stats.selfBalancedCount} مفردة\n`;
    out += `- خيار تنوين النصب: ${includeTanween ? 'مشمول (مثل: هُوداً، قَوْماً، بيتاً، نَاراً...)' : 'غير مشمول (الكلمات المجردة فقط)'}\n\n`;

    out += `=========================================\n`;
    out += `### ثانياً: شبكة الحروف النورانية الـ 14 وجميع الأحرف المقابلة لها في ميزان (${balanceLetter})\n`;
    out += `=========================================\n\n`;

    nooraniSummariesList.forEach((item, idx) => {
        out += `[${idx + 1}] حرف ${item.nooraniName} (${item.nooraniLetter}):\n`;
        out += `-----------------------------------------\n`;
        out += `- عدد الأحرف المقابلة له: ${item.totalPartnersCount} حرفاً (${item.nooraniPartnersCount} نوراني + ${item.dhulmaniPartnersCount} غير نوراني)\n`;
        out += `- إجمالي مواضع الكلمات الحاضنة: ${item.totalWordOccurrences} موضعاً قرآنياً\n`;
        out += `- قائمة الأحرف المقابلة: [ ${item.partnerLetters.map(p => p.partnerLetter).join('، ')} ]\n`;
        out += `- التفاصيل والمعادلات والمفردات:\n`;

        item.partnerLetters.forEach(p => {
            const kind = p.isPartnerNoorani ? 'نوراني ✨' : 'غير نوراني';
            const wordsList = p.words.map(w => `«${w.word}» (${w.frequency} مرة)`).join('، ');
            out += `  * المقابل [ ${p.partnerLetter} ] (${kind}) ⟵ المعادلات: ${p.equations.join(' / ')} | الكلمات: ${wordsList}\n`;
        });
        out += `\n`;
    });

    out += `=========================================\n`;
    out += `### ثالثاً: الأزواج المتناظرة عكوسياً (Symmetric Balance Pairs: A = B و B = A)\n`;
    out += `=========================================\n`;
    out += `> مفردات قرآنية تبادلت فيها الحروف موقع كفتي الميزان عبر كلمتين قرآنيتين مختلفتين:\n\n`;

    symmetricPairs.forEach((pair, idx) => {
        const eqA = pair.equationA;
        const eqB = pair.equationB;
        out += `${idx + 1}. الزوج التناظري [ ${eqA.leftLetter} ⟷ ${eqA.rightLetter} ]:\n`;
        out += `   - الاتجاه (1): ${eqA.leftLetter} = ${eqA.rightLetter} ⟵ عبر مفردات: ${eqA.words.map(w => `«${w.word}» (${w.frequency})`).join('، ')}\n`;
        out += `   - الاتجاه (2): ${eqB.leftLetter} = ${eqB.rightLetter} ⟵ عبر مفردات: ${eqB.words.map(w => `«${w.word}» (${w.frequency})`).join('، ')}\n`;
        out += `   - إجمالي التكرار الكلي للزوج: ${eqA.totalOccurrences + eqB.totalOccurrences} موضعاً\n\n`;
    });

    out += `=========================================\n`;
    out += `### رابعاً: فهرس جميع معادلات الميزان والمفردات القرآنية الحاضنة كاملاً\n`;
    out += `=========================================\n\n`;
    out += `| # | المعادلة | الحرف الأول (L1) | الحرف الثاني (L2) | نوع العلاقة | الكلمات القرآنية الحاضنة | إجمالي الورود |\n`;
    out += `|---|---|---|---|---|---|---|\n`;

    allEquations.forEach((eq, idx) => {
        let typeStr = '';
        if (eq.relationType === 'noorani-noorani') typeStr = 'نوراني ⟷ نوراني';
        else if (eq.relationType === 'noorani-dhulmani' || eq.relationType === 'dhulmani-noorani') typeStr = 'نوراني ⟷ غير نوراني';
        else typeStr = 'غير نوراني ⟷ غير نوراني';

        const wordsStr = eq.words.map(w => `${w.word} (${w.frequency})`).join('، ');
        out += `| ${idx + 1} | ${eq.leftLetter} = ${eq.rightLetter} | ${eq.leftLetter} | ${eq.rightLetter} | ${typeStr} | ${wordsStr} | ${eq.totalOccurrences} |\n`;
    });

    if (selfBalancedWords.length > 0) {
        out += `\n=========================================\n`;
        out += `### خامساً: المفردات ذات الميزان الذاتي المتطابق (L1 = L1)\n`;
        out += `=========================================\n`;
        selfBalancedWords.forEach((w, idx) => {
            out += `${idx + 1}. كلمة «${w.word}» ⟵ المعادلة: ${w.firstLetter} = ${w.secondLetter} (تكرار: ${w.frequency} موضع)\n`;
        });
    }

    out += `\n=========================================\n`;
    out += `تم تصدير هذا التقرير الشامل بدقة من المصحف الشريف عبر أداة «ميزان الحرف الأوسط» في تطبيق qran.top.\n`;

    return out;
}

/**
 * Generates an AI-optimized prompt containing the complete analysis and targeted instructions
 * for LLMs (ChatGPT, Claude, Gemini, DeepSeek) to analyze linguistic and structural patterns.
 */
export function generateAiPromptMizanWaw(
    analysis: MizanWawAnalysisResult,
    includeTanween: boolean = true
): string {
    const { balanceLetter = 'و', balanceLetterName = 'الواو' } = analysis;
    const report = generateFullMizanWawReport(analysis, includeTanween);
    return `أنت باحث خبير في الإعجاز البياني وبنية المصحف الشريف واللسانيات القرآنية الحسابية.
أقدم إليك فيما يلي دراسة استقصائية شاملة مستخرجة من المصحف الشريف لقاعدة لغوية وبنائية بعنوان: «مِيزَانُ ${balanceLetterName.toUpperCase()} (${balanceLetter}) فِي كَلِمَاتِ الْقُرْآنِ الْكَرِيمِ الثُّلَاثِيَّةِ».

[الفكرة والمنهجية]:
- يقوم البرنامج بحصر كل كلمة قرآنية ثلاثية الأحرف يتوسطها حرف ${balanceLetterName} (${balanceLetter}) بصيغة (L1 + ${balanceLetter} + L2).
- يُعتبر حرف "${balanceLetterName}" هو الميزان ونقطة التكافؤ بين الحرفين الجانبيين فينتج عنه معادلة توازن (L1 = L2).
- ثم حصر وجمع النتائج لكل حرف من الحروف النورانية الـ 14 ("نص حكيم قاطع له سر") لمعرفة كافة الأحرف التي تقابله في كفتي الميزان.

[المطلوب منك في تحليلك]:
1. دراسة شبكة العلاقات الناتجة لكل حرف نوراني والأحرف المقابلة له وبيان العلاقات الصوتية والدلالية بينها.
2. تحليل دلالات التقابل بين الحروف النورانية وغير النورانية، وما إذا كانت هناك لطائف لغوية أو معنوية مشتركة في السياقات القرآنية.
3. دراسة الأزواج المتناظرة عكوسياً (Symmetric Pairs: مثل A=B و B=A) ودلالة تبادل كفتي الميزان بين الكلمات في القرآن الكريم.
4. تقديم خلاصة إحصائية ولغوية محكمة تجيب عن أسرار هذا التناظر الحرفي القرآني البديع واستخراج الاستنتاجات العلمية والبيانية.

--------------------------------------------------
البيانات الاستقصائية الكاملة المستخرجة من القرآن الكريم:
--------------------------------------------------
${report}`;
}

/**
 * Generates a concise summary focusing specifically on the 14 Noorani letters
 * and their counterpart partner letters in the selected Mizan.
 */
export function generateNooraniOnlyReport(
    analysis: MizanWawAnalysisResult
): string {
    const { 
        balanceLetter = 'و', 
        balanceLetterName = 'الواو',
        nooraniSummariesList, 
        stats 
    } = analysis;

    let out = `# مِيزَانُ ${balanceLetterName.toUpperCase()} (${balanceLetter}): شَبَكَةُ الْحُرُوفِ النُّورَانِيَّةِ الـ 14 وَمُقَابِلَاتِهَا\n\n`;
    out += `حرف الميزان: ${balanceLetterName} (${balanceLetter}) | إجمالي المفردات: ${stats.totalUniqueWords} كلمة (${stats.totalWordOccurrences} موضع) | علاقات التوازن: ${stats.totalUniqueEquations}\n\n`;

    nooraniSummariesList.forEach((item, idx) => {
        out += `### [${idx + 1}] حرف ${item.nooraniName} (${item.nooraniLetter}):\n`;
        out += `- عدد الأحرف المقابلة: ${item.totalPartnersCount} حرفاً (${item.nooraniPartnersCount} نوراني + ${item.dhulmaniPartnersCount} غير نوراني)\n`;
        out += `- قائمة المقابلات: [ ${item.partnerLetters.map(p => p.partnerLetter).join('، ')} ]\n`;
        out += `- التفاصيل بالكلمات الحاضنة:\n`;
        item.partnerLetters.forEach(p => {
            const kind = p.isPartnerNoorani ? 'نوراني ✨' : 'غير نوراني';
            const wordsStr = p.words.map(w => `${w.word} (${w.frequency})`).join('، ');
            out += `  * المقابل [ ${p.partnerLetter} ] (${kind}) ⟵ المعادلات: ${p.equations.join(' / ')} | الكلمات: ${wordsStr}\n`;
        });
        out += `\n`;
    });

    return out;
}

/**
 * Generates a full structured JSON export suitable for programmatic analysis and AI models.
 */
export function generateFullMizanWawJson(
    analysis: MizanWawAnalysisResult, 
    includeTanween: boolean = true
): string {
    const { balanceLetter = 'و', balanceLetterName = 'الواو' } = analysis;
    return JSON.stringify({
        title: `ميزان ${balanceLetterName} (${balanceLetter}) في كلمات القرآن الكريم الثلاثية`,
        balanceLetter,
        balanceLetterName,
        methodology: `L1 + ${balanceLetter} + L2 => L1 = L2`,
        options: { includeTanweenAlif: includeTanween },
        stats: analysis.stats,
        nooraniLettersSummary: analysis.nooraniSummariesList.map(n => ({
            letter: n.nooraniLetter,
            name: n.nooraniName,
            partnersCount: n.totalPartnersCount,
            nooraniPartnersCount: n.nooraniPartnersCount,
            dhulmaniPartnersCount: n.dhulmaniPartnersCount,
            totalWordOccurrences: n.totalWordOccurrences,
            partners: n.partnerLetters.map(p => ({
                partnerLetter: p.partnerLetter,
                isNoorani: p.isPartnerNoorani,
                equations: p.equations,
                direction: p.direction,
                totalOccurrences: p.totalOccurrences,
                words: p.words.map(w => ({ word: w.word, frequency: w.frequency }))
            }))
        })),
        symmetricPairs: analysis.symmetricPairs.map(p => ({
            pairKey: p.pairKey,
            equationA: {
                equation: p.equationA.id,
                words: p.equationA.words.map(w => ({ word: w.word, frequency: w.frequency })),
                totalOccurrences: p.equationA.totalOccurrences
            },
            equationB: {
                equation: p.equationB.id,
                words: p.equationB.words.map(w => ({ word: w.word, frequency: w.frequency })),
                totalOccurrences: p.equationB.totalOccurrences
            },
            totalCombinedOccurrences: p.equationA.totalOccurrences + p.equationB.totalOccurrences
        })),
        allEquations: analysis.allEquations.map(e => ({
            equation: `${e.leftLetter} = ${e.rightLetter}`,
            L1: e.leftLetter,
            L2: e.rightLetter,
            relationType: e.relationType,
            isLeftNoorani: e.isLeftNoorani,
            isRightNoorani: e.isRightNoorani,
            isSymmetric: e.isSymmetric,
            words: e.words.map(w => ({ word: w.word, frequency: w.frequency })),
            totalOccurrences: e.totalOccurrences
        })),
        selfBalancedWords: analysis.selfBalancedWords.map(w => ({
            word: w.word,
            letter: w.firstLetter,
            frequency: w.frequency
        }))
    }, null, 2);
}

export type DualPairRankingMode = 
    | 'frequency'      // الأكثر تكراراً في القرآن الكريم (الأعلى وزناً)
    | 'diversity'      // الأكثر تنوعاً في المفردات الحاضنة
    | 'symmetric'      // الأولوية للأزواج المتناظرة عكوسياً (A=B و B=A)
    | 'balanced'       // توازن الكفتين (أفضل نوراني + أفضل غير نوراني)
    | 'unique-optimal'; // توزيع حصري ذكي لتغطية الـ 28 حرفاً دون تكرار (14 × 2 = 28)

export interface NooraniDualPartnerResult {
    nooraniLetter: string;
    nooraniName: string;
    partner1: NooraniPartnerDetail | null;
    partner2: NooraniPartnerDetail | null;
    allPartners: NooraniPartnerDetail[];
    coverageStatus: 'full' | 'partial' | 'none'; // full = 2 partners, partial = 1 partner, none = 0
}

export interface DualExtractionSummary {
    mode: DualPairRankingMode;
    balanceLetter: string;
    balanceLetterName: string;
    results: NooraniDualPartnerResult[];
    totalNooraniCount: number;
    fullyCoveredCount: number; // had 2 partners
    partiallyCoveredCount: number; // had 1 partner
    uncoveredCount: number; // had 0
    uniquePartnerLettersCount: number; // how many distinct letters of the 28 alphabet are covered
    uniquePartnerLetters: string[];
}

/**
 * Extracts exactly 2 counterpart letters for each of the 14 Noorani letters
 * according to the selected ranking mode (frequency, diversity, symmetry, balance, or global unique distribution).
 */
export function extractDualPartnersForNoorani(
    analysis: MizanWawAnalysisResult,
    mode: DualPairRankingMode = 'frequency'
): DualExtractionSummary {
    const { balanceLetter, balanceLetterName, nooraniSummariesList, symmetricPairs } = analysis;
    
    // Set of symmetric partner pairs for fast lookup
    const symmetricSet = new Set<string>();
    symmetricPairs.forEach(p => {
        symmetricSet.add(`${p.equationA.leftLetter}=${p.equationA.rightLetter}`);
        symmetricSet.add(`${p.equationA.rightLetter}=${p.equationA.leftLetter}`);
    });

    const isSymmetricWith = (nLetter: string, pLetter: string) => {
        return symmetricSet.has(`${nLetter}=${pLetter}`) || symmetricSet.has(`${pLetter}=${nLetter}`);
    };

    let results: NooraniDualPartnerResult[] = [];

    if (mode === 'unique-optimal') {
        // Greedy assignment algorithm to maximize unique 28 alphabet coverage
        const sortedSummaries = [...nooraniSummariesList].sort(
            (a, b) => a.partnerLetters.length - b.partnerLetters.length
        );

        const usedLetters = new Set<string>();
        const resultMap = new Map<string, NooraniDualPartnerResult>();

        for (const item of sortedSummaries) {
            const nLetter = item.nooraniLetter;
            const availablePartners = [...item.partnerLetters].sort((a, b) => b.totalOccurrences - a.totalOccurrences);

            let p1: NooraniPartnerDetail | null = null;
            let p2: NooraniPartnerDetail | null = null;

            for (const p of availablePartners) {
                if (!usedLetters.has(p.partnerLetter)) {
                    p1 = p;
                    usedLetters.add(p.partnerLetter);
                    break;
                }
            }

            for (const p of availablePartners) {
                if (p !== p1 && !usedLetters.has(p.partnerLetter)) {
                    p2 = p;
                    usedLetters.add(p.partnerLetter);
                    break;
                }
            }

            if (!p1 && availablePartners.length > 0) {
                p1 = availablePartners[0];
            }
            if (!p2 && availablePartners.length > 1) {
                p2 = availablePartners.find(p => p !== p1) || null;
            }

            const coverageStatus: NooraniDualPartnerResult['coverageStatus'] = 
                (p1 && p2) ? 'full' : (p1 || p2) ? 'partial' : 'none';

            resultMap.set(nLetter, {
                nooraniLetter: nLetter,
                nooraniName: item.nooraniName,
                partner1: p1,
                partner2: p2,
                allPartners: item.partnerLetters,
                coverageStatus
            });
        }

        results = CANONICAL_14_NOORANI.map(char => resultMap.get(char)!);
    } else {
        results = nooraniSummariesList.map(item => {
            const nLetter = item.nooraniLetter;
            const partners = [...item.partnerLetters];

            if (mode === 'diversity') {
                partners.sort((a, b) => {
                    if (b.words.length !== a.words.length) return b.words.length - a.words.length;
                    return b.totalOccurrences - a.totalOccurrences;
                });
            } else if (mode === 'symmetric') {
                partners.sort((a, b) => {
                    const aSym = isSymmetricWith(nLetter, a.partnerLetter) ? 1 : 0;
                    const bSym = isSymmetricWith(nLetter, b.partnerLetter) ? 1 : 0;
                    if (bSym !== aSym) return bSym - aSym;
                    return b.totalOccurrences - a.totalOccurrences;
                });
            } else if (mode === 'balanced') {
                const nooraniPartners = partners.filter(p => p.isPartnerNoorani).sort((a, b) => b.totalOccurrences - a.totalOccurrences);
                const dhulmaniPartners = partners.filter(p => !p.isPartnerNoorani).sort((a, b) => b.totalOccurrences - a.totalOccurrences);

                let p1 = nooraniPartners[0] || null;
                let p2 = dhulmaniPartners[0] || null;

                if (!p1 && dhulmaniPartners.length > 1) {
                    p1 = dhulmaniPartners[0];
                    p2 = dhulmaniPartners[1];
                } else if (!p2 && nooraniPartners.length > 1) {
                    p2 = nooraniPartners[1];
                }

                const coverageStatus: NooraniDualPartnerResult['coverageStatus'] = 
                    (p1 && p2) ? 'full' : (p1 || p2) ? 'partial' : 'none';

                return {
                    nooraniLetter: nLetter,
                    nooraniName: item.nooraniName,
                    partner1: p1,
                    partner2: p2,
                    allPartners: item.partnerLetters,
                    coverageStatus
                };
            } else {
                // Default 'frequency'
                partners.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
            }

            const p1 = partners[0] || null;
            const p2 = partners[1] || null;
            const coverageStatus: NooraniDualPartnerResult['coverageStatus'] = 
                (p1 && p2) ? 'full' : (p1 || p2) ? 'partial' : 'none';

            return {
                nooraniLetter: nLetter,
                nooraniName: item.nooraniName,
                partner1: p1,
                partner2: p2,
                allPartners: item.partnerLetters,
                coverageStatus
            };
        });
    }

    const fullyCoveredCount = results.filter(r => r.coverageStatus === 'full').length;
    const partiallyCoveredCount = results.filter(r => r.coverageStatus === 'partial').length;
    const uncoveredCount = results.filter(r => r.coverageStatus === 'none').length;

    const uniquePartnerSet = new Set<string>();
    results.forEach(r => {
        if (r.partner1) uniquePartnerSet.add(r.partner1.partnerLetter);
        if (r.partner2) uniquePartnerSet.add(r.partner2.partnerLetter);
    });

    return {
        mode,
        balanceLetter,
        balanceLetterName,
        results,
        totalNooraniCount: CANONICAL_14_NOORANI.length,
        fullyCoveredCount,
        partiallyCoveredCount,
        uncoveredCount,
        uniquePartnerLettersCount: uniquePartnerSet.size,
        uniquePartnerLetters: Array.from(uniquePartnerSet)
    };
}

export interface MizanComparisonCandidate {
    id: string; // 'و' | 'ا' | 'ي' | 'tri-madd'
    name: string;
    badge: string;
    description: string;
    totalUniqueWords: number;
    totalWordOccurrences: number;
    totalEquations: number;
    symmetricPairsCount: number;
    nooraniCoverage14: number; // how many out of 14 have >=1 partner
    nooraniFullDualCoverage14: number; // how many out of 14 have >=2 partners (complete dual balance)
    pros: string;
    recommendationLabel: string;
    isRecommended?: boolean;
}

/**
 * Compares the primary Mizan candidates (و, ا, ي, tri-madd) to advise the user on which balance letter to choose.
 */
export function compareMizanCandidateLetters(
    simpleCleanData: SurahData[],
    includeTanweenAlif: boolean = true
): MizanComparisonCandidate[] {
    const candidates = [
        {
            id: 'tri-madd',
            name: 'أحرف المد والعلة الثلاثة (و + ا + ي)',
            badge: 'الميزان التكاملي الأكمل 🌟',
            description: 'يجمع حروف الأجوف الثلاثة معاً في ميزان موحد شامل يزن الكلمات الثلاثية المعتلة.',
            pros: 'أعلى نسبة تغطية على الإطلاق (100% لجميع الـ 14 حرفاً نورانياً)، يمنح كل حرف نوراني كفتين كاملتين دون أي نقص، ويحل إشكال الحيرة بين الحروف.',
            recommendationLabel: 'الخيار الأكمل والأنصح لحل الحيرة ووزن الكفتين بدقة 14 ⟵ 28',
            isRecommended: true
        },
        {
            id: 'و',
            name: 'ميزان الواو الأصلي (و)',
            badge: 'الميزان البنيوي الأصيل ⚖️',
            description: 'نقطة ارتكاز المفردات الثلاثية ذات الرنين والتوازن الدقيق مثل (هود، قوم، نور، صوت، لوح).',
            pros: 'أصالة منهجية عالية وتناظر محكم مع الكلمات الدالة في القرآن الكريم ونقاء صوتي رفيع.',
            recommendationLabel: 'الخيار الأفضل للباحثين عن ميزان أحادي أصيل ونقي'
        },
        {
            id: 'ا',
            name: 'ميزان الألف (ا)',
            badge: 'أضخم رصيد قرآني 📖',
            description: 'الحرف الأكثر توسطاً ودوراناً في القرآن (قال، كان، طال، نار، دار، قام، باب).',
            pros: 'أضخم رصيد إحصائي وتكراري من الكلمات، يغطي 13 من 14 حرفاً نورانياً بحرفين على الأقل.',
            recommendationLabel: 'الخيار الأفضل لمن يريد أضخم رصيد إحصائي وتكراري'
        },
        {
            id: 'ي',
            name: 'ميزان الياء (ي)',
            badge: 'ميزان اللطائف الصوتية ✨',
            description: 'يزن الكلمات الثلاثية اليايئية الدقيقة مثل (دين، بيت، خير، غيب، طير، سير، عين).',
            pros: 'روابط دلالية وعقدية عميقة بين المفردات، تناظر لطيف وخفيف بين الحروف.',
            recommendationLabel: 'الخيار المتخصص للبحث الصوتي والمعنوي اللطيف'
        }
    ];

    return candidates.map(cand => {
        const analysis = analyzeMizanWaw(simpleCleanData, {
            balanceLetter: cand.id,
            includeTanweenAlif
        });
        const dualSummary = extractDualPartnersForNoorani(analysis, 'frequency');

        return {
            id: cand.id,
            name: cand.name,
            badge: cand.badge,
            description: cand.description,
            totalUniqueWords: analysis.stats.totalUniqueWords,
            totalWordOccurrences: analysis.stats.totalWordOccurrences,
            totalEquations: analysis.stats.totalUniqueEquations,
            symmetricPairsCount: analysis.stats.symmetricPairsCount,
            nooraniCoverage14: analysis.nooraniSummariesList.filter(n => n.totalPartnersCount > 0).length,
            nooraniFullDualCoverage14: dualSummary.fullyCoveredCount,
            pros: cand.pros,
            recommendationLabel: cand.recommendationLabel,
            isRecommended: cand.isRecommended
        };
    });
}

/**
 * Generates an analytical text report tailored for AI models explaining the dual counterparts (14 ⟶ 28).
 */
export function generateDualPartnersReport(
    summary: DualExtractionSummary,
    analysis: MizanWawAnalysisResult
): string {
    const { mode, balanceLetter, balanceLetterName, results, fullyCoveredCount, uniquePartnerLettersCount, uniquePartnerLetters } = summary;

    const modeLabels: Record<DualPairRankingMode, string> = {
        'frequency': 'الأعلى تكراراً في القرآن الكريم (وزن التكرار)',
        'diversity': 'الأعلى تنوعاً في المفردات القرآنية الحاضنة',
        'symmetric': 'الأولوية للأزواج المتناظرة عكوسياً (A=B و B=A)',
        'balanced': 'توازن الكفتين (حرف نوراني + حرف غير نوراني)',
        'unique-optimal': 'التوزيع الحصري لتغطية أكبر عدد من حروف الأبجدية الـ 28'
    };

    let out = `# مِيزَانُ الْكَفَّتَيْنِ: اسْتِخْرَاجُ حَرْفَيْنِ مُقَابِلَيْنِ لِكُلِّ حَرْفٍ نُورَانِيٍّ (14 ⟵ 28)\n`;
    out += `## تقرير علمي تحليلي مهيأ للذكاء الاصطناعي مستخرج بدقة من المصحف الشريف عبر تطبيق qran.top\n\n`;

    out += `=========================================\n`;
    out += `### إعدادات الميزان والمعيار المعتمد:\n`;
    out += `=========================================\n`;
    out += `- حرف الميزان: ${balanceLetterName} (${balanceLetter})\n`;
    out += `- معيار ترتيب واختيار الحرفين: ${modeLabels[mode]}\n`;
    out += `- نسبة اكتمال الكفتين (حرفين كاملين): ${fullyCoveredCount} من أصل 14 حرفاً نورانياً (${Math.round((fullyCoveredCount / 14) * 100)}%)\n`;
    out += `- عدد الحروف الفريدة المغطاة من الأبجدية: ${uniquePartnerLettersCount} حرفاً من أصل 28 حرفاً\n`;
    out += `- قائمة الحروف المغطاة: [ ${uniquePartnerLetters.join('، ')} ]\n\n`;

    out += `=========================================\n`;
    out += `### جدول الحرفين المقابلين لكافة الحروف النورانية الـ 14:\n`;
    out += `=========================================\n\n`;

    out += `| # | الحرف النوراني | كفة اليمين (الحرف 1) | كفة اليسار (الحرف 2) | معادلات الميزان | المفردات الحاضنة | إجمالي الورود |\n`;
    out += `|---|---|---|---|---|---|---|\n`;

    results.forEach((r, idx) => {
        const p1Str = r.partner1 ? `${r.partner1.partnerLetter} (${r.partner1.isPartnerNoorani ? 'نوراني ✨' : 'غير نوراني'})` : 'غير متوفر';
        const p2Str = r.partner2 ? `${r.partner2.partnerLetter} (${r.partner2.isPartnerNoorani ? 'نوراني ✨' : 'غير نوراني'})` : 'غير متوفر';
        
        const eqList: string[] = [];
        if (r.partner1) eqList.push(...r.partner1.equations);
        if (r.partner2) eqList.push(...r.partner2.equations);
        const eqStr = eqList.length > 0 ? eqList.join(' / ') : '-';

        const wordsList: string[] = [];
        if (r.partner1) wordsList.push(...r.partner1.words.map(w => `${w.word} (${w.frequency})`));
        if (r.partner2) wordsList.push(...r.partner2.words.map(w => `${w.word} (${w.frequency})`));
        const wordsStr = wordsList.length > 0 ? wordsList.slice(0, 5).join('، ') : '-';

        const totalOcc = (r.partner1?.totalOccurrences || 0) + (r.partner2?.totalOccurrences || 0);

        out += `| ${idx + 1} | ${r.nooraniName} (${r.nooraniLetter}) | ${p1Str} | ${p2Str} | ${eqStr} | ${wordsStr} | ${totalOcc} موضع |\n`;
    });

    out += `\n=========================================\n`;
    out += `### توجيه للذكاء الاصطناعي (AI Prompt & Instructions):\n`;
    out += `=========================================\n`;
    out += `أنت باحث خبير في الإعجاز البياني واللسانيات القرآنية الحسابية.\n`;
    out += `استناداً إلى جدول الكفتين المستخرج أعلاه (حيث يُقابل كل حرف نوراني حرفين من حروف الأبجدية):\n`;
    out += `1. حلل التوازن الصوتي والدلالي بين الحرف النوراني في الوسط والحرفين المقابلين في كفتي الميزان.\n`;
    out += `2. ادرس توزيع الحروف الـ 28 على الحروف النورانية الـ 14، ومدى انتظام هذه الشبكة الرياضية في القرآن الكريم.\n`;
    out += `3. استنبط دلالات الجمع بين هذه الحروف في الألفاظ القرآنية الحاضنة للميزان.\n`;

    return out;
}
