import { normalizeArabicText } from './text';

// حرف الواو خارج الأحرف الأبجدية كلياً وغير مشمول بجميع أنظمة المسح
export const EXCLUDED_LETTERS = "و";
export const ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهي"; // 27 حرفاً فقط (بدون الواو)
export const TOTAL_ALPHABET_COUNT = 27;
export const ALL_LETTERS_MASK = (1 << 27) - 1; // 0x07FFFFFF (27 bits)

export type ExtractionStrategy = 'all_letters' | 'first_letter' | 'last_letter' | 'first_and_last';
export type ScanDirection = 'optimal' | 'shortest' | 'forward' | 'backward';

export interface FlatWord {
    index: number;
    text: string;
    normalized: string;
    mask: number;
    surah: number;
    ayah: number;
    surahName: string;
    wordInAyah: number;
}

export interface DiscoveredLetter {
    letter: string;
    orderIndex: number; // 1 to 27
    wordIndex: number;
    wordText: string;
    surah: number;
    surahName: string;
    ayah: number;
    charIndexInWord?: number;
    distanceFromStart: number; // in words
}

export interface AlternativeClusterOption {
    id: string;
    title: string;
    startWordIndex: number;
    endWordIndex: number;
    totalWordsSpanned: number;
    ayahsSpanned: number;
    averageGap: number;
    maxGap: number;
    densityRatio: number;
    startSurah: number;
    startAyah: number;
    endSurah: number;
    endAyah: number;
    surahName: string;
    description: string;
}

export interface AlphabetExtractionResult {
    sequence: string[]; // Discovered unique letters in this cluster
    discoveredLetters: DiscoveredLetter[];
    startWordIndex: number;
    endWordIndex: number;
    pivotWordIndex?: number;
    totalWordsSpanned: number;
    isComplete28: boolean; // Retained for compatibility (true when 27 letters reached)
    isComplete27: boolean; // 27 letters reached without Waw
    isClusterComplete: boolean; // Reached targetLetterCount
    targetLetterCount: number; // e.g. 22 to 27
    densityRatio: number; // sequence.length / totalWordsSpanned
    strategy: ExtractionStrategy;
    direction: ScanDirection;
    firstLetter: string;
    missingLetters: string[]; // 27 letters minus discovered sequence
    ayahsSpanned?: number; // Total distinct ayahs spanned
    averageGap?: number; // Average word gap between consecutive chosen words
    maxGap?: number; // Maximum gap between consecutive chosen words
    alternativeClusters?: AlternativeClusterOption[]; // Top candidate windows for rotation
}

export interface AlphabetReference {
    id: string;
    name: string;
    description: string;
    sequence: string;
    category: 'traditional' | 'phonetic' | 'structural' | 'frequency';
}

export const REFERENCE_ALPHABETS: AlphabetReference[] = [
    {
        id: 'hijai',
        name: 'الترتيب الألفبائي الهجائي (نصر بن عاصم - دون الواو)',
        description: 'الترتيب الإملائي المعاصر بعد استبعاد حرف الواو كلياً (27 حرفاً).',
        sequence: 'ابتثجحخدذرزسشصضطظعغفقكلمنهي',
        category: 'traditional'
    },
    {
        id: 'abjad_eastern',
        name: 'الترتيب الأبجدي المشرقي (أبجد هز - دون الواو)',
        description: 'الترتيب السامي بحساب الجمل مع استبعاد حرف الواو (27 حرفاً).',
        sequence: 'ابجدهزحطيكلمنسعفصقرشتثخذضظغ',
        category: 'traditional'
    },
    {
        id: 'abjad_western',
        name: 'الترتيب الأبجدي المغربي (دون الواو)',
        description: 'ترتيب أهل المغرب والأندلس بحساب الجمل بعد استبعاد حرف الواو (27 حرفاً).',
        sequence: 'ابجدهزحطيكلمنصعفضقرستثخذظغش',
        category: 'traditional'
    },
    {
        id: 'phonetic_farahidi',
        name: 'الترتيب الصوتي (الخليل بن أحمد الفراهيدي - دون الواو)',
        description: 'ترتيب معجم العين حسب مخارج الحروف بعد استبعاد حرف الواو (27 حرفاً).',
        sequence: 'عحهخغقكجشضصسزطدتظذثرلنفبميا',
        category: 'phonetic'
    },
    {
        id: 'muqattaat_priority',
        name: 'ترتيب الحروف النورانية أولاً (نص حكيم قاطع له سر - دون الواو)',
        description: 'الحروف المقطعة الـ 14 متبوعة بباقي حروف المعجم مع استبعاد حرف الواو.',
        sequence: 'نصحكيمقاطعلهسربتثجخدذزشضظغف',
        category: 'structural'
    },
    {
        id: 'quran_frequency',
        name: 'ترتيب التكرار الإحصائي في القرآن الكريم (دون الواو)',
        description: 'ترتيب الحروف من الأكثر تكراراً إلى الأقل تكراراً في القرآن بعد استبعاد حرف الواو (27 حرفاً).',
        sequence: 'النميهربتكعفسدقحجشضصخذزطثظغ',
        category: 'frequency'
    }
];

export interface AlphabetMatchComparison {
    referenceId: string;
    referenceName: string;
    referenceSequence: string;
    exactMatchesCount: number; // Letters in the same exact index
    matchPercentage: number;
    matchingIndices: number[]; // 0-based indices
    levenshteinDistance: number;
}

export const getLetterMask = (word: string): number => {
    let mask = 0;
    const norm = normalizeArabicText(word);
    for (let i = 0; i < norm.length; i++) {
        const char = norm[i];
        if (char === 'و') continue; // حرف الواو مستثنى كلياً
        const idx = ARABIC_LETTERS.indexOf(char);
        if (idx !== -1) {
            mask |= (1 << idx);
        }
    }
    return mask;
};

/**
 * Computes letter bitmask for a word based on chosen extraction strategy
 * Excluding the letter Waw ('و') from any extraction
 */
export const getWordStrategyMask = (fw: FlatWord, strategy: ExtractionStrategy): number => {
    if (!fw || !fw.normalized || fw.normalized.length === 0) return 0;
    if (strategy === 'all_letters') {
        return fw.mask;
    }
    const norm = fw.normalized;
    const validIndices: number[] = [];
    for (let i = 0; i < norm.length; i++) {
        const c = norm[i];
        if (c !== 'و') {
            const idx = ARABIC_LETTERS.indexOf(c);
            if (idx !== -1) {
                validIndices.push(idx);
            }
        }
    }
    if (validIndices.length === 0) return 0;

    if (strategy === 'first_letter') {
        return (1 << validIndices[0]);
    }
    if (strategy === 'last_letter') {
        return (1 << validIndices[validIndices.length - 1]);
    }
    if (strategy === 'first_and_last') {
        let m = (1 << validIndices[0]);
        if (validIndices.length > 1) {
            m |= (1 << validIndices[validIndices.length - 1]);
        }
        return m;
    }
    return fw.mask;
};

/**
 * Counts the number of set bits (1s) in a 32-bit integer
 */
export const countBits = (n: number): number => {
    let count = 0;
    let v = n;
    while (v > 0) {
        v &= (v - 1);
        count++;
    }
    return count;
};

/**
 * Helper to extract valid alphabet characters from normalized word text
 * Strictly excluding letter Waw ('و')
 */
export const getValidWordLetters = (norm: string): { char: string; charIdx: number }[] => {
    const list: { char: string; charIdx: number }[] = [];
    for (let c = 0; c < norm.length; c++) {
        const ch = norm[c];
        if (ch !== 'و' && ARABIC_LETTERS.includes(ch)) {
            list.push({ char: ch, charIdx: c });
        }
    }
    return list;
};

/**
 * Extracts candidate characters from a FlatWord according to the chosen ExtractionStrategy
 */
export const getWordLettersByStrategy = (fw: FlatWord, strategy: ExtractionStrategy): { char: string; charIdx: number }[] => {
    if (!fw || !fw.normalized || fw.normalized.length === 0) return [];
    const valid = getValidWordLetters(fw.normalized);
    if (valid.length === 0) return [];
    if (strategy === 'all_letters') return valid;
    if (strategy === 'first_letter') return [valid[0]];
    if (strategy === 'last_letter') return [valid[valid.length - 1]];
    if (strategy === 'first_and_last') {
        return valid.length > 1 ? [valid[0], valid[valid.length - 1]] : [valid[0]];
    }
    return valid;
};

/**
 * Finds the shortest enclosing window [L, R] around targetIdx (where L <= targetIdx <= R)
 * that contains at least targetLetterCount (default 27) distinct Arabic letters under the specified extraction strategy.
 * Letter Waw ('و') is completely excluded.
 */
export const findShortestEnclosingWindow = (
    flatWords: FlatWord[],
    targetIdx: number,
    strategy: ExtractionStrategy = 'all_letters',
    surahConstraint?: number,
    targetLetterCount: number = 27
): { bestL: number; bestR: number; bestLen: number } => {
    if (!flatWords || flatWords.length === 0 || targetIdx < 0 || targetIdx >= flatWords.length) {
        return { bestL: -1, bestR: -1, bestLen: Infinity };
    }

    const effectiveTarget = Math.max(1, Math.min(27, targetLetterCount));
    const maxRadius = (strategy === 'first_letter' || strategy === 'last_letter') ? 3000 : 800;
    let minL = Math.max(0, targetIdx - maxRadius);
    let maxR = Math.min(flatWords.length - 1, targetIdx + maxRadius);

    if (surahConstraint !== undefined) {
        while (minL <= targetIdx && flatWords[minL]?.surah !== surahConstraint) {
            minL++;
        }
        while (maxR >= targetIdx && flatWords[maxR]?.surah !== surahConstraint) {
            maxR--;
        }
    }

    const counts = new Uint16Array(27);
    let distinct = 0;
    let left = minL;
    let bestL = -1;
    let bestR = -1;
    let bestLen = Infinity;

    const rangeLen = maxR - minL + 1;
    if (rangeLen <= 0) return { bestL: -1, bestR: -1, bestLen: Infinity };

    const masks = new Int32Array(rangeLen);
    for (let i = 0; i < rangeLen; i++) {
        masks[i] = getWordStrategyMask(flatWords[minL + i], strategy);
    }

    for (let right = minL; right <= maxR; right++) {
        const rMask = masks[right - minL];
        if (rMask !== 0) {
            for (let b = 0; b < 27; b++) {
                if (rMask & (1 << b)) {
                    if (counts[b] === 0) distinct++;
                    counts[b]++;
                }
            }
        }

        while (distinct >= effectiveTarget && left <= targetIdx) {
            if (right >= targetIdx) {
                const curLen = right - left + 1;
                if (curLen < bestLen) {
                    bestLen = curLen;
                    bestL = left;
                    bestR = right;
                }
            }
            const lMask = masks[left - minL];
            if (lMask !== 0) {
                for (let b = 0; b < 27; b++) {
                    if (lMask & (1 << b)) {
                        counts[b]--;
                        if (counts[b] === 0) distinct--;
                    }
                }
            }
            left++;
        }
    }

    return { bestL, bestR, bestLen };
};

/**
 * Counts the exact number of distinct verses in range [L, R]
 */
export const countAyahsSpanned = (flatWords: FlatWord[], L: number, R: number): number => {
    if (!flatWords || L < 0 || R >= flatWords.length || L > R) return 0;
    const wL = flatWords[L];
    const wR = flatWords[R];
    if (!wL || !wR) return 0;
    if (wL.surah === wR.surah) {
        return Math.max(1, wR.ayah - wL.ayah + 1);
    }
    const set = new Set<string>();
    for (let i = L; i <= R; i++) {
        const w = flatWords[i];
        if (w) set.add(`${w.surah}:${w.ayah}`);
    }
    return Math.max(1, set.size);
};

/**
 * Explores and rotates all candidate sliding windows in the neighborhood or surah constraint.
 * Evaluates candidates by:
 * 1. Number of Ayahs spanned (primary - minimizing ayahs)
 * 2. Total words spanned (secondary - minimizing word count)
 * 3. Distance from targetIdx (tertiary)
 * Returns the globally/locally optimal window and a ranked list of AlternativeClusterOption.
 */
export const findOptimalAlphabetWindow = (
    flatWords: FlatWord[],
    targetIdx: number,
    strategy: ExtractionStrategy = 'all_letters',
    surahConstraint?: number,
    targetLetterCount: number = 27
): {
    bestL: number;
    bestR: number;
    bestLen: number;
    ayahsSpanned: number;
    alternativeClusters: AlternativeClusterOption[];
} => {
    if (!flatWords || flatWords.length === 0 || targetIdx < 0 || targetIdx >= flatWords.length) {
        return { bestL: -1, bestR: -1, bestLen: Infinity, ayahsSpanned: 0, alternativeClusters: [] };
    }

    const effectiveTarget = Math.max(1, Math.min(27, targetLetterCount));
    const maxRadius = (strategy === 'first_letter' || strategy === 'last_letter') ? 3500 : 1000;
    let minL = Math.max(0, targetIdx - maxRadius);
    let maxR = Math.min(flatWords.length - 1, targetIdx + maxRadius);

    if (surahConstraint !== undefined) {
        while (minL <= targetIdx && flatWords[minL]?.surah !== surahConstraint) minL++;
        while (maxR >= targetIdx && flatWords[maxR]?.surah !== surahConstraint) maxR--;
    }

    const rangeLen = maxR - minL + 1;
    if (rangeLen <= 0) return { bestL: -1, bestR: -1, bestLen: Infinity, ayahsSpanned: 0, alternativeClusters: [] };

    const masks = new Int32Array(rangeLen);
    for (let i = 0; i < rangeLen; i++) {
        masks[i] = getWordStrategyMask(flatWords[minL + i], strategy);
    }

    const counts = new Uint16Array(27);
    let distinct = 0;
    let left = minL;

    interface CandidateWindow {
        left: number;
        right: number;
        wordsSpanned: number;
        ayahsSpanned: number;
        distFromTarget: number;
        surahName: string;
        startSurah: number;
        startAyah: number;
        endSurah: number;
        endAyah: number;
    }

    const candidates: CandidateWindow[] = [];

    for (let right = minL; right <= maxR; right++) {
        const rMask = masks[right - minL];
        if (rMask !== 0) {
            for (let b = 0; b < 27; b++) {
                if (rMask & (1 << b)) {
                    if (counts[b] === 0) distinct++;
                    counts[b]++;
                }
            }
        }

        while (distinct >= effectiveTarget) {
            const wL = flatWords[left];
            const wR = flatWords[right];
            const wordsSpanned = right - left + 1;
            const ayahsSpanned = (wL.surah === wR.surah)
                ? (wR.ayah - wL.ayah + 1)
                : (wR.surah - wL.surah) * 30 + (wR.ayah); // approximate if across surahs

            const distFromTarget = (left <= targetIdx && targetIdx <= right)
                ? 0
                : Math.min(Math.abs(targetIdx - left), Math.abs(targetIdx - right));

            candidates.push({
                left,
                right,
                wordsSpanned,
                ayahsSpanned,
                distFromTarget,
                surahName: wL.surahName,
                startSurah: wL.surah,
                startAyah: wL.ayah,
                endSurah: wR.surah,
                endAyah: wR.ayah
            });

            const lMask = masks[left - minL];
            if (lMask !== 0) {
                for (let b = 0; b < 27; b++) {
                    if (lMask & (1 << b)) {
                        counts[b]--;
                        if (counts[b] === 0) distinct--;
                    }
                }
            }
            left++;
        }
    }

    if (candidates.length === 0) {
        // Fallback to standard enclosing window
        const fallback = findShortestEnclosingWindow(flatWords, targetIdx, strategy, surahConstraint, effectiveTarget);
        return {
            bestL: fallback.bestL,
            bestR: fallback.bestR,
            bestLen: fallback.bestLen,
            ayahsSpanned: countAyahsSpanned(flatWords, fallback.bestL, fallback.bestR),
            alternativeClusters: []
        };
    }

    // Rank candidates: primary by fewest ayahs, secondary by wordsSpanned, tertiary by distance from target
    candidates.sort((a, b) => {
        if (a.ayahsSpanned !== b.ayahsSpanned) return a.ayahsSpanned - b.ayahsSpanned;
        if (a.wordsSpanned !== b.wordsSpanned) return a.wordsSpanned - b.wordsSpanned;
        return a.distFromTarget - b.distFromTarget;
    });

    const best = candidates[0];

    // Filter distinct alternative clusters (spaced at least 15 words apart)
    const distinctCandidates: CandidateWindow[] = [];
    for (const cand of candidates) {
        if (!distinctCandidates.some(u => Math.abs(u.left - cand.left) < 15)) {
            distinctCandidates.push(cand);
            if (distinctCandidates.length >= 8) break;
        }
    }

    const alternativeClusters: AlternativeClusterOption[] = distinctCandidates.map((cand, idx) => {
        const title = cand.startSurah === cand.endSurah
            ? `${cand.surahName} (الآيات ${cand.startAyah} - ${cand.endAyah})`
            : `${cand.surahName} (${cand.startAyah}) إلى ${flatWords[cand.right]?.surahName || ''} (${cand.endAyah})`;
        
        const description = idx === 0
            ? `الخيار الأمثل: أقل عدد آيات (${cand.ayahsSpanned} آيات فقط) في ${cand.wordsSpanned} كلمة.`
            : `احتمال بديل (${idx + 1}): يشمل ${cand.ayahsSpanned} آيات و${cand.wordsSpanned} كلمة.`;

        const avgGap = effectiveTarget > 1 ? Number(((cand.wordsSpanned - 1) / (effectiveTarget - 1)).toFixed(1)) : 0;

        return {
            id: `cluster_${cand.left}_${cand.right}`,
            title,
            startWordIndex: cand.left,
            endWordIndex: cand.right,
            totalWordsSpanned: cand.wordsSpanned,
            ayahsSpanned: cand.ayahsSpanned,
            averageGap: avgGap,
            maxGap: 0,
            densityRatio: Number((effectiveTarget / cand.wordsSpanned).toFixed(4)),
            startSurah: cand.startSurah,
            startAyah: cand.startAyah,
            endSurah: cand.endSurah,
            endAyah: cand.endAyah,
            surahName: cand.surahName,
            description
        };
    });

    return {
        bestL: best.left,
        bestR: best.right,
        bestLen: best.wordsSpanned,
        ayahsSpanned: best.ayahsSpanned,
        alternativeClusters
    };
};

/**
 * Optimizes the selection of words within a cluster window [startL, endR] to minimize:
 * 1. Number of unique ayahs used
 * 2. Maximum gap between consecutive chosen words
 * 3. Sum of squared gaps (even, dense proximity)
 */
export const optimizeWordProximityInCluster = (
    flatWords: FlatWord[],
    startL: number,
    endR: number,
    strategy: ExtractionStrategy,
    targetLetterCount: number = 27,
    pivotWordIndex?: number
): {
    sequence: string[];
    discoveredLetters: DiscoveredLetter[];
    startWordIndex: number;
    endWordIndex: number;
    totalWordsSpanned: number;
    ayahsSpanned: number;
    averageGap: number;
    maxGap: number;
    densityRatio: number;
} => {
    const effectiveTarget = Math.max(1, Math.min(27, targetLetterCount));
    const pivot = pivotWordIndex !== undefined ? pivotWordIndex : startL;

    // Collect candidate letters for each word in [startL, endR]
    const wordCandidates: { char: string; charIdx: number }[][] = [];
    for (let i = startL; i <= endR; i++) {
        const fw = flatWords[i];
        if (!fw || !fw.normalized) {
            wordCandidates.push([]);
            continue;
        }
        wordCandidates.push(getWordLettersByStrategy(fw, strategy));
    }

    // Shrink [startL, endR] to minimal tight bounds [tightL, tightR]
    const counts = new Uint16Array(27);
    let distinct = 0;
    let l = 0;
    let tightL = 0;
    let tightR = wordCandidates.length - 1;
    let minSpan = wordCandidates.length;

    for (let r = 0; r < wordCandidates.length; r++) {
        for (const cand of wordCandidates[r]) {
            const idx = ARABIC_LETTERS.indexOf(cand.char);
            if (idx !== -1) {
                if (counts[idx] === 0) distinct++;
                counts[idx]++;
            }
        }

        while (distinct >= effectiveTarget) {
            if (r - l + 1 < minSpan) {
                minSpan = r - l + 1;
                tightL = l;
                tightR = r;
            }
            for (const cand of wordCandidates[l]) {
                const idx = ARABIC_LETTERS.indexOf(cand.char);
                if (idx !== -1) {
                    counts[idx]--;
                    if (counts[idx] === 0) distinct--;
                }
            }
            l++;
        }
    }

    const actualStart = startL + tightL;
    const actualEnd = startL + tightR;

    // Map each letter to its candidate occurrences inside [actualStart, actualEnd]
    interface WordOccurrence {
        wordIndex: number;
        charIndexInWord?: number;
        ayah: number;
        surah: number;
        text: string;
    }

    const letterToOccurrences = new Map<string, WordOccurrence[]>();
    for (let i = actualStart; i <= actualEnd; i++) {
        const fw = flatWords[i];
        const cands = getWordLettersByStrategy(fw, strategy);
        for (const cand of cands) {
            const ch = cand.char;
            if (ch === 'و' || !ARABIC_LETTERS.includes(ch)) continue;
            if (!letterToOccurrences.has(ch)) {
                letterToOccurrences.set(ch, []);
            }
            letterToOccurrences.get(ch)!.push({
                wordIndex: i,
                charIndexInWord: cand.charIdx,
                ayah: fw.ayah,
                surah: fw.surah,
                text: fw.text
            });
        }
    }

    const availableLetters = Array.from(letterToOccurrences.keys());
    const chosenByLetter = new Map<string, WordOccurrence>();

    // Initial assignment: pick occurrence closest to pivot
    for (const ch of availableLetters) {
        const occs = letterToOccurrences.get(ch)!;
        let bestOcc = occs[0];
        let bestDist = Math.abs(bestOcc.wordIndex - pivot);
        for (let j = 1; j < occs.length; j++) {
            const d = Math.abs(occs[j].wordIndex - pivot);
            if (d < bestDist) {
                bestDist = d;
                bestOcc = occs[j];
            }
        }
        chosenByLetter.set(ch, bestOcc);
    }

    // Scoring function: evaluates distinct ayahs, maxGap, and sumSq
    const scoreState = () => {
        const indices = Array.from(chosenByLetter.values()).map(o => o.wordIndex).sort((a, b) => a - b);
        let maxGap = 0;
        let sumSq = 0;
        const ayahs = new Set<number>();
        for (const occ of chosenByLetter.values()) {
            ayahs.add(occ.ayah);
        }
        for (let i = 1; i < indices.length; i++) {
            const gap = indices[i] - indices[i - 1];
            if (gap > maxGap) maxGap = gap;
            sumSq += gap * gap;
        }
        return { ayahsCount: ayahs.size, maxGap, sumSq };
    };

    // Coordinate descent optimization to compact words and minimize gaps
    let currentScore = scoreState();
    let improved = true;
    let iters = 0;
    while (improved && iters < 25) {
        improved = false;
        iters++;
        for (const ch of availableLetters) {
            const occs = letterToOccurrences.get(ch)!;
            if (occs.length <= 1) continue;
            const originalOcc = chosenByLetter.get(ch)!;

            for (const cand of occs) {
                if (cand.wordIndex === originalOcc.wordIndex) continue;
                chosenByLetter.set(ch, cand);
                const newScore = scoreState();

                const isBetter = 
                    newScore.ayahsCount < currentScore.ayahsCount ||
                    (newScore.ayahsCount === currentScore.ayahsCount && newScore.maxGap < currentScore.maxGap) ||
                    (newScore.ayahsCount === currentScore.ayahsCount && newScore.maxGap === currentScore.maxGap && newScore.sumSq < currentScore.sumSq);

                if (isBetter) {
                    currentScore = newScore;
                    improved = true;
                } else {
                    chosenByLetter.set(ch, originalOcc);
                }
            }
        }
    }

    // Build ordered DiscoveredLetter[] list
    const finalOccurrences: DiscoveredLetter[] = Array.from(chosenByLetter.entries()).map(([char, occ]) => {
        const fw = flatWords[occ.wordIndex];
        return {
            letter: char,
            orderIndex: 0,
            wordIndex: occ.wordIndex,
            wordText: fw.text,
            surah: fw.surah,
            surahName: fw.surahName,
            ayah: fw.ayah,
            charIndexInWord: occ.charIndexInWord,
            distanceFromStart: Math.abs(occ.wordIndex - pivot)
        };
    }).sort((a, b) => a.wordIndex - b.wordIndex);

    const sequence = finalOccurrences.map((fo, idx) => {
        fo.orderIndex = idx + 1;
        return fo.letter;
    });

    const totalWordsSpanned = Math.max(1, actualEnd - actualStart + 1);
    const averageGap = sequence.length > 1 ? Number(((actualEnd - actualStart) / (sequence.length - 1)).toFixed(2)) : 0;

    return {
        sequence,
        discoveredLetters: finalOccurrences,
        startWordIndex: actualStart,
        endWordIndex: actualEnd,
        totalWordsSpanned,
        ayahsSpanned: currentScore.ayahsCount,
        averageGap,
        maxGap: currentScore.maxGap,
        densityRatio: Number((sequence.length / totalWordsSpanned).toFixed(4))
    };
};

/**
 * Extracts sequence of letters from flatWords starting at a specific position using the chosen strategy
 * Stops when targetLetterCount (default 27) unique letters are collected or scope ends
 * Excludes letter Waw ('و') across all strategies
 */
export const extractAlphabetSequence = (
    flatWords: FlatWord[],
    startIndex: number,
    strategy: ExtractionStrategy = 'all_letters',
    direction: ScanDirection = 'optimal',
    surahConstraint?: number,
    targetLetterCount: number = 27
): AlphabetExtractionResult => {
    const effectiveTarget = Math.max(1, Math.min(27, targetLetterCount));

    if (!flatWords || flatWords.length === 0 || startIndex < 0 || startIndex >= flatWords.length) {
        return {
            sequence: [],
            discoveredLetters: [],
            startWordIndex: startIndex,
            endWordIndex: startIndex,
            pivotWordIndex: startIndex,
            totalWordsSpanned: 0,
            isComplete28: false,
            isComplete27: false,
            isClusterComplete: false,
            targetLetterCount: effectiveTarget,
            densityRatio: 0,
            strategy,
            direction,
            firstLetter: '',
            missingLetters: ARABIC_LETTERS.split(''),
            ayahsSpanned: 0,
            averageGap: 0,
            maxGap: 0,
            alternativeClusters: []
        };
    }

    // Direction: optimal (المسح الذكي وتدوير جميع الاحتمالات لأقل عدد آيات) or shortest
    if (direction === 'optimal' || direction === 'shortest') {
        const { bestL, bestR, alternativeClusters } = findOptimalAlphabetWindow(
            flatWords,
            startIndex,
            strategy,
            surahConstraint,
            effectiveTarget
        );

        let startL = bestL;
        let endR = bestR;

        // Graceful fallback if target not reachable in scope
        if (startL === -1 || endR === -1) {
            if (surahConstraint !== undefined) {
                startL = flatWords.findIndex(w => w.surah === surahConstraint);
                endR = flatWords.map(w => w.surah).lastIndexOf(surahConstraint);
            } else {
                startL = Math.max(0, startIndex - 100);
                endR = Math.min(flatWords.length - 1, startIndex + 100);
            }
            if (startL === -1) startL = startIndex;
            if (endR === -1) endR = startIndex;
        }

        // Apply proximity optimization to tightly compact words and minimize gaps/ayahs
        const opt = optimizeWordProximityInCluster(
            flatWords,
            startL,
            endR,
            strategy,
            effectiveTarget,
            startIndex
        );

        const missingLetters = ARABIC_LETTERS.split('').filter(l => !opt.sequence.includes(l));

        return {
            sequence: opt.sequence,
            discoveredLetters: opt.discoveredLetters,
            startWordIndex: opt.startWordIndex,
            endWordIndex: opt.endWordIndex,
            pivotWordIndex: startIndex,
            totalWordsSpanned: opt.totalWordsSpanned,
            isComplete28: opt.sequence.length >= 27,
            isComplete27: opt.sequence.length === 27,
            isClusterComplete: opt.sequence.length >= effectiveTarget,
            targetLetterCount: effectiveTarget,
            densityRatio: opt.densityRatio,
            strategy,
            direction,
            firstLetter: opt.sequence[0] || '',
            missingLetters,
            ayahsSpanned: opt.ayahsSpanned,
            averageGap: opt.averageGap,
            maxGap: opt.maxGap,
            alternativeClusters
        };
    }

    // Standard Forward or Backward scan, followed by proximity optimization to trim excess distance
    const isBackward = direction === 'backward';
    let currentIndex = startIndex;
    let endWordIndex = startIndex;
    const seen = new Set<string>();

    while (
        currentIndex >= 0 &&
        currentIndex < flatWords.length &&
        seen.size < effectiveTarget
    ) {
        const fw = flatWords[currentIndex];

        if (surahConstraint !== undefined && fw.surah !== surahConstraint) {
            break;
        }

        endWordIndex = currentIndex;
        const cands = getWordLettersByStrategy(fw, strategy);

        for (const { char } of cands) {
            if (char !== 'و' && ARABIC_LETTERS.includes(char)) {
                seen.add(char);
                if (seen.size >= effectiveTarget) break;
            }
        }

        if (isBackward) {
            currentIndex--;
        } else {
            currentIndex++;
        }
    }

    const rawStart = Math.min(startIndex, endWordIndex);
    const rawEnd = Math.max(startIndex, endWordIndex);

    // Apply proximity optimization to compact words even in forward/backward modes
    const opt = optimizeWordProximityInCluster(
        flatWords,
        rawStart,
        rawEnd,
        strategy,
        effectiveTarget,
        startIndex
    );

    const missingLetters = ARABIC_LETTERS.split('').filter(l => !opt.sequence.includes(l));

    return {
        sequence: opt.sequence,
        discoveredLetters: opt.discoveredLetters,
        startWordIndex: opt.startWordIndex,
        endWordIndex: opt.endWordIndex,
        pivotWordIndex: startIndex,
        totalWordsSpanned: opt.totalWordsSpanned,
        isComplete28: opt.sequence.length >= 27,
        isComplete27: opt.sequence.length === 27,
        isClusterComplete: opt.sequence.length >= effectiveTarget,
        targetLetterCount: effectiveTarget,
        densityRatio: opt.densityRatio,
        strategy,
        direction,
        firstLetter: opt.sequence[0] || '',
        missingLetters,
        ayahsSpanned: opt.ayahsSpanned,
        averageGap: opt.averageGap,
        maxGap: opt.maxGap,
        alternativeClusters: []
    };
};

/**
 * Calculates match statistics between an extracted sequence and standard reference alphabets (27 letters)
 */
export const compareSequenceWithReferences = (sequence: string[]): AlphabetMatchComparison[] => {
    return REFERENCE_ALPHABETS.map(ref => {
        const refChars = ref.sequence.split('');
        let exactMatches = 0;
        const matchingIndices: number[] = [];

        const compareLen = Math.min(sequence.length, refChars.length);
        for (let i = 0; i < compareLen; i++) {
            if (sequence[i] === refChars[i]) {
                exactMatches++;
                matchingIndices.push(i);
            }
        }

        // Levenshtein distance approximation for sequence similarity
        const seqStr = sequence.join('');
        const refStr = ref.sequence;
        const levDist = calculateLevenshtein(seqStr, refStr);

        const matchPct = compareLen > 0 ? Math.round((exactMatches / 27) * 100) : 0;

        return {
            referenceId: ref.id,
            referenceName: ref.name,
            referenceSequence: ref.sequence,
            exactMatchesCount: exactMatches,
            matchPercentage: matchPct,
            matchingIndices,
            levenshteinDistance: levDist
        };
    });
};

function calculateLevenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

export interface PresetAyah {
    id: string;
    surah: number;
    surahName: string;
    ayah: number;
    title: string;
    description: string;
    preview: string;
}

export const PRESET_SCAN_POINTS: PresetAyah[] = [
    {
        id: 'anam_94',
        surah: 6,
        surahName: 'الأنعام',
        ayah: 94,
        title: 'الأنعام (٦: ٩٤ - ١٠١) - الرقم القياسي لأوائل الكلمات (٨ آيات فقط!)',
        description: 'أقصر وأكثف نطاق قرآني استطاعت الخوارزمية اكتشافه لاقتناص الأبجدية كاملة (27 حرفاً دون الواو) من أوائل الكلمات في ٨ آيات فقط و161 كلمة وبأدنى تباعد.',
        preview: 'وَلَقَدْ جِئْتُمُونَا فُرَادَىٰ كَمَا خَلَقْنَاكُمْ أَوَّلَ مَرَّةٍ وَتَرَكْتُم مَّا خَوَّلْنَاكُمْ وَرَاءَ ظُهُورِكُمْ... بَدِيعُ السَّمَاوَاتِ وَالْأَرْضِ أَنَّىٰ يَكُونُ لَهُ وَلَدٌ'
    },
    {
        id: 'nisa_1',
        surah: 4,
        surahName: 'النساء',
        ayah: 1,
        title: 'النساء (٤: ١ - ٦) - كتلة أوائل الكلمات المتقاربة (٦ آيات فقط)',
        description: 'اقتناص الأبجدية الـ 27 كاملة من أوائل الكلمات في فضاء ٦ آيات فقط متتالية بأعلى تقارب.',
        preview: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَخَلَقَ مِنْهَا زَوْجَهَا وَبَثَّ مِنْهُمَا رِجَالًا كَثِيرًا وَنِسَاءً...'
    },
    {
        id: 'saba_15',
        surah: 34,
        surahName: 'سبأ',
        ayah: 15,
        title: 'سبأ (٣٤: ١٥ - ٢٦) - تقارب فائق لأوائل الكلمات (١٢ آية فقط)',
        description: 'نافذة نموذجية تضم الأبجدية كاملة من أوائل الكلمات في 12 آية فقط متقاربة الكلمات.',
        preview: 'لَقَدْ كَانَ لِسَبَإٍ فِي مَسْكَنِهِمْ آيَةٌ جَنَّتَانِ... قُلْ يَجْمَعُ بَيْنَنَا رَبُّنَا ثُمَّ يَفْتَحُ بَيْنَنَا بِالْحَقِّ...'
    },
    {
        id: 'yunus_2',
        surah: 10,
        surahName: 'يونس',
        ayah: 2,
        title: 'يونس (١٠: ٢ - ١٣) - كتلة يونس المكتنزة (١٢ آية فقط)',
        description: 'حوت الأبجدية كاملة الـ 27 من أوائل الكلمات في 12 آية فقط متتابعة.',
        preview: 'أَكَانَ لِلنَّاسِ عَجَبًا أَنْ أَوْحَيْنَا إِلَىٰ رَجُلٍ مِّنْهُمْ... وَلَقَدْ أَهْلَكْنَا الْقُرُونَ مِن قَبْلِكُمْ...'
    },
    {
        id: 'fath_29',
        surah: 48,
        surahName: 'الفتح',
        ayah: 29,
        title: 'آية الفتح الجامعة (٤٨: ٢٩)',
        description: 'الآية الشهيرة الجامعة لكافة حروف المعجم الـ 27 بعد استبعاد حرف الواو في آية واحدة.',
        preview: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ...'
    },
    {
        id: 'imran_154',
        surah: 3,
        surahName: 'آل عمران',
        ayah: 154,
        title: 'آية آل عمران الجامعة (٣: ١٥٤)',
        description: 'الآية الكريمة الثانية التي حوت جميع حروف المعجم الـ 27 كاملة (دون الواو) في آية واحدة.',
        preview: 'ثُمَّ أَنزَلَ عَلَيْكُم مِّن بَعْدِ الْغَمِّ أَمَنَةً نُّعَاسًا يَغْشَىٰ طَائِفَةً مِّنكُمْ...'
    },
    {
        id: 'fatiha_1',
        surah: 1,
        surahName: 'الفاتحة',
        ayah: 1,
        title: 'فاتحة الكتاب (١: ١)',
        description: 'أم الكتاب والسبع المثاني - بداية التنزيل والتسلسل المصحفي.',
        preview: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
    },
    {
        id: 'baqarah_1',
        surah: 2,
        surahName: 'البقرة (الم)',
        ayah: 1,
        title: 'فاتحة البقرة (٢: ١)',
        description: 'أولى سور الفواتح النورانية (الم) وبداية أطول سور المصحف.',
        preview: 'الم ﴿١﴾ ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ'
    },
    {
        id: 'maryam_1',
        surah: 19,
        surahName: 'مريم (كهيعص)',
        ayah: 1,
        title: 'فاتحة مريم (١٩: ١)',
        description: 'أطول سلسلة حروف مقطعة خماسية في فواتح السور (كهيعص).',
        preview: 'كهيعص ﴿١﴾ ذِكْرُ رَحْمَتِ رَبِّكَ عَبْدَهُ زَكَرِيَّا'
    },
    {
        id: 'yaseen_1',
        surah: 36,
        surahName: 'يس',
        ayah: 1,
        title: 'فاتحة يس (٣٦: ١)',
        description: 'قلب القرآن وفاتحة الحرفين النورانيين (يس).',
        preview: 'يس ﴿١﴾ وَالْقُرْآنِ الْحَكِيمِ ﴿٢﴾ إِنَّكَ لَمِنَ الْمُرْسَلِينَ'
    }
];
