import { normalizeArabicText } from './text';

export const ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
export const ALL_LETTERS_MASK = 0x0FFFFFFF; // 28 bits

export type ExtractionStrategy = 'all_letters' | 'first_letter' | 'last_letter' | 'first_and_last';
export type ScanDirection = 'forward' | 'backward' | 'shortest';

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
    orderIndex: number; // 1 to 28
    wordIndex: number;
    wordText: string;
    surah: number;
    surahName: string;
    ayah: number;
    charIndexInWord?: number;
    distanceFromStart: number; // in words
}

export interface AlphabetExtractionResult {
    sequence: string[]; // 28 letters or fewer if end of scope reached
    discoveredLetters: DiscoveredLetter[];
    startWordIndex: number;
    endWordIndex: number;
    pivotWordIndex?: number;
    totalWordsSpanned: number;
    isComplete28: boolean;
    strategy: ExtractionStrategy;
    direction: ScanDirection;
    firstLetter: string;
    missingLetters: string[];
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
        name: 'الترتيب الألفبائي الهجائي (نصر بن عاصم)',
        description: 'الترتيب الإملائي المعاصر المعتمد على تشابه رسم الحروف وتتابع النقط.',
        sequence: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
        category: 'traditional'
    },
    {
        id: 'abjad_eastern',
        name: 'الترتيب الأبجدي المشرقي (أبجد هوز)',
        description: 'الترتيب السامي القديم بحساب الجمل (أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ).',
        sequence: 'ابجدهوزحطيكلمنسعفصقرشتثخذضظغ',
        category: 'traditional'
    },
    {
        id: 'abjad_western',
        name: 'الترتيب الأبجدي المغربي',
        description: 'ترتيب أهل المغرب والأندلس بحساب الجمل (أبجد هوز حطي كلمن صعفض قرست ثخذ ظغش).',
        sequence: 'ابجدهوزحطيكلمنصعفضقرستثخذظغش',
        category: 'traditional'
    },
    {
        id: 'phonetic_farahidi',
        name: 'الترتيب الصوتي (الخليل بن أحمد الفراهيدي)',
        description: 'ترتيب معجم العين حسب مخارج الحروف من أقصى الحلق إلى الشفتين وحروف الجوف والمد (28 حرفاً تنتهي بالألف والهمزة).',
        sequence: 'عحهخغقكجشضصسزطدتظذثرلنفبمويا',
        category: 'phonetic'
    },
    {
        id: 'muqattaat_priority',
        name: 'ترتيب الحروف النورانية أولاً (نص حكيم قاطع له سر)',
        description: 'الحروف المقطعة الـ 14 الواردة في فواتح السور متبوعة بباقي الحروف الهجائية الـ 14 كاملة.',
        sequence: 'نصحكيمقاطعلهسربتثجخدذزشضظغفو',
        category: 'structural'
    },
    {
        id: 'quran_frequency',
        name: 'ترتيب التكرار الإحصائي في القرآن الكريم',
        description: 'ترتيب الحروف من الأكثر تكراراً إلى الأقل تكراراً في النص القرآني كاملاً (28 حرفاً متضمنة حرف الزاي قبل الطاء والثاء).',
        sequence: 'النمويهربتكعفسدقحجشضصخذزطثظغ',
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
        const idx = ARABIC_LETTERS.indexOf(norm[i]);
        if (idx !== -1) {
            mask |= (1 << idx);
        }
    }
    return mask;
};

/**
 * Computes letter bitmask for a word based on chosen extraction strategy
 */
export const getWordStrategyMask = (fw: FlatWord, strategy: ExtractionStrategy): number => {
    if (!fw || !fw.normalized || fw.normalized.length === 0) return 0;
    if (strategy === 'all_letters') {
        return fw.mask;
    }
    const norm = fw.normalized;
    if (strategy === 'first_letter') {
        const idx = ARABIC_LETTERS.indexOf(norm[0]);
        return idx !== -1 ? (1 << idx) : 0;
    }
    if (strategy === 'last_letter') {
        const idx = ARABIC_LETTERS.indexOf(norm[norm.length - 1]);
        return idx !== -1 ? (1 << idx) : 0;
    }
    if (strategy === 'first_and_last') {
        let m = 0;
        const i1 = ARABIC_LETTERS.indexOf(norm[0]);
        if (i1 !== -1) m |= (1 << i1);
        const i2 = ARABIC_LETTERS.indexOf(norm[norm.length - 1]);
        if (i2 !== -1) m |= (1 << i2);
        return m;
    }
    return fw.mask;
};

/**
 * Finds the shortest enclosing window [L, R] around targetIdx (where L <= targetIdx <= R)
 * that contains all 28 Arabic letters under the specified extraction strategy.
 */
export const findShortestEnclosingWindow = (
    flatWords: FlatWord[],
    targetIdx: number,
    strategy: ExtractionStrategy = 'all_letters',
    surahConstraint?: number
): { bestL: number; bestR: number; bestLen: number } => {
    if (!flatWords || flatWords.length === 0 || targetIdx < 0 || targetIdx >= flatWords.length) {
        return { bestL: -1, bestR: -1, bestLen: Infinity };
    }

    const maxRadius = (strategy === 'first_letter' || strategy === 'last_letter') ? 2500 : 500;
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

    const counts = new Uint16Array(28);
    let distinct = 0;
    let left = minL;
    let bestL = -1;
    let bestR = -1;
    let bestLen = Infinity;

    const rangeLen = maxR - minL + 1;
    const masks = new Int32Array(rangeLen);
    for (let i = 0; i < rangeLen; i++) {
        masks[i] = getWordStrategyMask(flatWords[minL + i], strategy);
    }

    for (let right = minL; right <= maxR; right++) {
        const rMask = masks[right - minL];
        if (rMask !== 0) {
            for (let b = 0; b < 28; b++) {
                if (rMask & (1 << b)) {
                    if (counts[b] === 0) distinct++;
                    counts[b]++;
                }
            }
        }

        while (distinct === 28 && left <= targetIdx) {
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
                for (let b = 0; b < 28; b++) {
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
 * Extracts sequence of letters from flatWords starting at a specific position using the chosen strategy
 */
export const extractAlphabetSequence = (
    flatWords: FlatWord[],
    startIndex: number,
    strategy: ExtractionStrategy = 'all_letters',
    direction: ScanDirection = 'forward',
    surahConstraint?: number
): AlphabetExtractionResult => {
    if (!flatWords || flatWords.length === 0 || startIndex < 0 || startIndex >= flatWords.length) {
        return {
            sequence: [],
            discoveredLetters: [],
            startWordIndex: startIndex,
            endWordIndex: startIndex,
            pivotWordIndex: startIndex,
            totalWordsSpanned: 0,
            isComplete28: false,
            strategy,
            direction,
            firstLetter: '',
            missingLetters: ARABIC_LETTERS.split('')
        };
    }

    const seen = new Set<string>();
    const sequence: string[] = [];
    const discoveredLetters: DiscoveredLetter[] = [];

    // Direction: shortest (متشعب - أقصر نافذة محيطة بالكلمة)
    if (direction === 'shortest') {
        const { bestL, bestR } = findShortestEnclosingWindow(flatWords, startIndex, strategy, surahConstraint);

        let startL = bestL;
        let endR = bestR;

        // Graceful fallback if complete 28 not reachable in scope
        if (startL === -1 || endR === -1) {
            if (surahConstraint !== undefined) {
                startL = flatWords.findIndex(w => w.surah === surahConstraint);
                endR = flatWords.map(w => w.surah).lastIndexOf(surahConstraint);
            } else {
                startL = Math.max(0, startIndex - 50);
                endR = Math.min(flatWords.length - 1, startIndex + 50);
            }
            if (startL === -1) startL = startIndex;
            if (endR === -1) endR = startIndex;
        }

        for (let i = startL; i <= endR; i++) {
            const fw = flatWords[i];
            if (!fw) continue;
            const norm = fw.normalized;
            if (!norm || norm.length === 0) continue;

            let candidateLetters: { char: string; charIdx: number }[] = [];
            if (strategy === 'all_letters') {
                for (let c = 0; c < norm.length; c++) {
                    candidateLetters.push({ char: norm[c], charIdx: c });
                }
            } else if (strategy === 'first_letter') {
                candidateLetters.push({ char: norm[0], charIdx: 0 });
            } else if (strategy === 'last_letter') {
                const lastIdx = norm.length - 1;
                candidateLetters.push({ char: norm[lastIdx], charIdx: lastIdx });
            } else if (strategy === 'first_and_last') {
                candidateLetters.push({ char: norm[0], charIdx: 0 });
                if (norm.length > 1) {
                    candidateLetters.push({ char: norm[norm.length - 1], charIdx: norm.length - 1 });
                }
            }

            for (const { char, charIdx } of candidateLetters) {
                if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                    seen.add(char);
                    sequence.push(char);
                    discoveredLetters.push({
                        letter: char,
                        orderIndex: sequence.length,
                        wordIndex: i,
                        wordText: fw.text,
                        surah: fw.surah,
                        surahName: fw.surahName,
                        ayah: fw.ayah,
                        charIndexInWord: charIdx,
                        distanceFromStart: Math.abs(i - startIndex)
                    });

                    if (seen.size === 28) {
                        break;
                    }
                }
            }
        }

        const missingLetters = ARABIC_LETTERS.split('').filter(l => !seen.has(l));
        return {
            sequence,
            discoveredLetters,
            startWordIndex: startL,
            endWordIndex: endR,
            pivotWordIndex: startIndex,
            totalWordsSpanned: endR - startL + 1,
            isComplete28: sequence.length === 28,
            strategy,
            direction,
            firstLetter: sequence[0] || '',
            missingLetters
        };
    }

    const isBackward = direction === 'backward';
    let currentIndex = startIndex;
    let endWordIndex = startIndex;

    while (
        currentIndex >= 0 &&
        currentIndex < flatWords.length &&
        seen.size < 28
    ) {
        const fw = flatWords[currentIndex];

        // If surah constraint is specified and we crossed outside it
        if (surahConstraint !== undefined && fw.surah !== surahConstraint) {
            break;
        }

        endWordIndex = currentIndex;
        const norm = fw.normalized;

        if (norm.length > 0) {
            let candidateLetters: { char: string; charIdx: number }[] = [];

            if (strategy === 'all_letters') {
                if (isBackward) {
                    for (let c = norm.length - 1; c >= 0; c--) {
                        candidateLetters.push({ char: norm[c], charIdx: c });
                    }
                } else {
                    for (let c = 0; c < norm.length; c++) {
                        candidateLetters.push({ char: norm[c], charIdx: c });
                    }
                }
            } else if (strategy === 'first_letter') {
                // First letter of the word
                candidateLetters.push({ char: norm[0], charIdx: 0 });
            } else if (strategy === 'last_letter') {
                // Last letter of the word
                const lastIdx = norm.length - 1;
                candidateLetters.push({ char: norm[lastIdx], charIdx: lastIdx });
            } else if (strategy === 'first_and_last') {
                if (isBackward) {
                    const lastIdx = norm.length - 1;
                    candidateLetters.push({ char: norm[lastIdx], charIdx: lastIdx });
                    if (lastIdx > 0) {
                        candidateLetters.push({ char: norm[0], charIdx: 0 });
                    }
                } else {
                    candidateLetters.push({ char: norm[0], charIdx: 0 });
                    if (norm.length > 1) {
                        candidateLetters.push({ char: norm[norm.length - 1], charIdx: norm.length - 1 });
                    }
                }
            }

            for (const { char, charIdx } of candidateLetters) {
                if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                    seen.add(char);
                    sequence.push(char);
                    discoveredLetters.push({
                        letter: char,
                        orderIndex: sequence.length,
                        wordIndex: currentIndex,
                        wordText: fw.text,
                        surah: fw.surah,
                        surahName: fw.surahName,
                        ayah: fw.ayah,
                        charIndexInWord: charIdx,
                        distanceFromStart: Math.abs(currentIndex - startIndex)
                    });

                    if (seen.size === 28) {
                        break;
                    }
                }
            }
        }

        if (isBackward) {
            currentIndex--;
        } else {
            currentIndex++;
        }
    }

    const start = Math.min(startIndex, endWordIndex);
    const end = Math.max(startIndex, endWordIndex);
    const missingLetters = ARABIC_LETTERS.split('').filter(l => !seen.has(l));

    return {
        sequence,
        discoveredLetters,
        startWordIndex: start,
        endWordIndex: end,
        totalWordsSpanned: end - start + 1,
        isComplete28: sequence.length === 28,
        strategy,
        direction,
        firstLetter: sequence[0] || '',
        missingLetters
    };
};

/**
 * Calculates match statistics between an extracted sequence and standard reference alphabets
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

        const matchPct = compareLen > 0 ? Math.round((exactMatches / 28) * 100) : 0;

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
        id: 'fath_29',
        surah: 48,
        surahName: 'الفتح',
        ayah: 29,
        title: 'آية الفتح الشاملة (٤٨: ٢٩)',
        description: 'الآية الشهيرة الجامعة لجميع حروف الهجاء الـ 28 في آية واحدة.',
        preview: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ...'
    },
    {
        id: 'imran_154',
        surah: 3,
        surahName: 'آل عمران',
        ayah: 154,
        title: 'آية آل عمران الجامعة (٣: ١٥٤)',
        description: 'الآية الثانية في القرآن الكريم التي حوت جميع حروف المعجم الـ 28 كاملة.',
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
