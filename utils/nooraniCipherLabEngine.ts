import type { SurahData } from '../types';
import { normalizeArabicText } from './text';
import { OptimalPartitionResult, Optimal2LetterAssignment } from './optimalMatchingEngine';
import { ARABIC_ALPHABET_28, CANONICAL_14_NOORANI_LETTERS } from './nooraniCipherEngine';

export interface EncryptedCharDetail {
    originalChar: string;
    normalizedChar: string;
    isArabicLetter: boolean;
    nooraniLetter: string;
    nooraniLetterName: string;
    rank: 1 | 2; // 1 = 🥇 المقابل الأول، 2 = 🥈 المقابل الثاني
    score: number;
    justification: string;
}

export interface EncryptionResult {
    originalText: string;
    cleanText: string;
    nooraniCipher: string;
    spacedCipher: string;
    details: EncryptedCharDetail[];
    uniqueNooraniLetters: string[];
    primaryRankCount: number;
    secondaryRankCount: number;
    totalScore: number;
    averageScore: number;
}

export interface DecryptedCombination {
    word: string;
    letterChoices: {
        noorani: string;
        chosenLetter: string;
        rank: 1 | 2;
        score: number;
    }[];
    totalScore: number;
    isQuranicWord: boolean;
    quranicOccurrences: number;
}

export interface DecryptionResult {
    inputCipher: string;
    cleanCipher: string;
    nooraniLetters: string[];
    isValidNooraniOnly: boolean;
    invalidLetters: string[];
    primaryDecodedWord: string;
    primaryTotalScore: number;
    secondaryDecodedWord: string;
    secondaryTotalScore: number;
    positions: {
        positionIndex: number;
        nooraniLetter: string;
        nooraniLetterName: string;
        option1: { char: string; name: string; score: number };
        option2: { char: string; name: string; score: number };
    }[];
    combinations: DecryptedCombination[];
    quranicWordsFound: DecryptedCombination[];
    totalPossibleCombinations: number;
}

/**
 * Builds a fast word frequency dictionary from the Quran dataset.
 */
let cachedLexicon: Map<string, number> | null = null;
let cachedLexiconDataRef: SurahData[] | null = null;

export function buildQuranLexicon(simpleCleanData: SurahData[]): Map<string, number> {
    if (cachedLexicon && cachedLexiconDataRef === simpleCleanData) {
        return cachedLexicon;
    }

    const dict = new Map<string, number>();
    if (!simpleCleanData || simpleCleanData.length === 0) return dict;

    for (let s = 0; s < simpleCleanData.length; s++) {
        const surah = simpleCleanData[s];
        for (let a = 0; a < surah.ayahs.length; a++) {
            const ayah = surah.ayahs[a];
            const rawTokens = ayah.text.split(/\s+/);
            for (let t = 0; t < rawTokens.length; t++) {
                const norm = normalizeArabicText(rawTokens[t]);
                if (norm && norm.length > 0) {
                    const count = dict.get(norm) || 0;
                    dict.set(norm, count + 1);
                }
            }
        }
    }

    cachedLexicon = dict;
    cachedLexiconDataRef = simpleCleanData;
    return dict;
}

/**
 * Creates reverse and forward lookup tables from the 14x2 Optimal Partition.
 */
export function buildPartitionLookupTables(partition: OptimalPartitionResult) {
    // Map: Arabic Char -> { noorani, rank, score, justification }
    const arabicToNoorani = new Map<string, {
        nooraniLetter: string;
        nooraniLetterName: string;
        rank: 1 | 2;
        score: number;
        justification: string;
    }>();

    // Map: Noorani Char -> Assignment
    const nooraniToPair = new Map<string, Optimal2LetterAssignment>();

    partition.assignments.forEach(assign => {
        nooraniToPair.set(assign.nooraniLetter, assign);

        // Letter 1 (🥇)
        arabicToNoorani.set(assign.letter1.char, {
            nooraniLetter: assign.nooraniLetter,
            nooraniLetterName: assign.nooraniLetterName,
            rank: 1,
            score: assign.letter1.score,
            justification: assign.letter1.justification
        });

        // Letter 2 (🥈)
        arabicToNoorani.set(assign.letter2.char, {
            nooraniLetter: assign.nooraniLetter,
            nooraniLetterName: assign.nooraniLetterName,
            rank: 2,
            score: assign.letter2.score,
            justification: assign.letter2.justification
        });
    });

    return { arabicToNoorani, nooraniToPair };
}

/**
 * ENCRYPTION ENGINE:
 * Converts any Arabic text/word into the Noorani Cipher based on the 14x2 Preferential Table.
 */
export function encryptWordWithPartition(
    text: string,
    partition: OptimalPartitionResult
): EncryptionResult {
    const { arabicToNoorani } = buildPartitionLookupTables(partition);

    const details: EncryptedCharDetail[] = [];
    const encodedChars: string[] = [];
    const spacedEncodedChars: string[] = [];
    let primaryCount = 0;
    let secondaryCount = 0;
    let totalScore = 0;

    const chars = text.split('');
    const nooraniLettersSet = new Set<string>();

    chars.forEach(originalChar => {
        // Space or newline or punctuation
        if (/\s/.test(originalChar)) {
            encodedChars.push(originalChar);
            spacedEncodedChars.push(originalChar);
            return;
        }

        const norm = normalizeArabicText(originalChar);
        if (!norm) {
            encodedChars.push(originalChar);
            spacedEncodedChars.push(originalChar);
            return;
        }

        // Standardize Alif / Hamza variations if needed
        const lookupChar = norm.charAt(0);
        const mapped = arabicToNoorani.get(lookupChar);

        if (mapped) {
            encodedChars.push(mapped.nooraniLetter);
            spacedEncodedChars.push(mapped.nooraniLetter);
            nooraniLettersSet.add(mapped.nooraniLetter);

            if (mapped.rank === 1) primaryCount++;
            else secondaryCount++;

            totalScore += mapped.score;

            details.push({
                originalChar,
                normalizedChar: lookupChar,
                isArabicLetter: true,
                nooraniLetter: mapped.nooraniLetter,
                nooraniLetterName: mapped.nooraniLetterName,
                rank: mapped.rank,
                score: mapped.score,
                justification: mapped.justification
            });
        } else {
            // In case of any unassigned symbol or character
            encodedChars.push(originalChar);
            spacedEncodedChars.push(originalChar);
            details.push({
                originalChar,
                normalizedChar: lookupChar,
                isArabicLetter: false,
                nooraniLetter: originalChar,
                nooraniLetterName: originalChar,
                rank: 1,
                score: 0,
                justification: 'حرف أو رمز خارج الأبجدية القياسية'
            });
        }
    });

    const arabicCount = primaryCount + secondaryCount;
    const avgScore = arabicCount > 0 ? Math.round((totalScore / arabicCount) * 10) / 10 : 0;

    return {
        originalText: text,
        cleanText: normalizeArabicText(text),
        nooraniCipher: encodedChars.join(''),
        spacedCipher: spacedEncodedChars.join(' '),
        details,
        uniqueNooraniLetters: Array.from(nooraniLettersSet),
        primaryRankCount: primaryCount,
        secondaryRankCount: secondaryCount,
        totalScore: Math.round(totalScore * 10) / 10,
        averageScore: avgScore
    };
}

/**
 * DECRYPTION ENGINE:
 * Decodes a sequence of Noorani letters into possible Arabic words.
 * Since each Noorani letter maps to 2 Arabic letters (L1 & L2),
 * a sequence of length N generates 2^N combinations.
 */
export function decryptCipherWithPartition(
    cipherInput: string,
    partition: OptimalPartitionResult,
    quranLexicon?: Map<string, number>
): DecryptionResult {
    const { nooraniToPair } = buildPartitionLookupTables(partition);
    const canonicalSet = new Set(CANONICAL_14_NOORANI_LETTERS.map(c => c.letter));

    // Normalize input
    const cleanCipher = normalizeArabicText(cipherInput).replace(/\s+/g, '');
    const cipherChars = cleanCipher.split('');

    const nooraniLetters: string[] = [];
    const invalidLetters: string[] = [];

    cipherChars.forEach(ch => {
        if (canonicalSet.has(ch) || nooraniToPair.has(ch)) {
            nooraniLetters.push(ch);
        } else {
            invalidLetters.push(ch);
        }
    });

    const isValidNooraniOnly = invalidLetters.length === 0;

    // Build position options
    const positions: DecryptionResult['positions'] = [];
    const primaryLetters: string[] = [];
    const secondaryLetters: string[] = [];
    let primaryTotalScore = 0;
    let secondaryTotalScore = 0;

    nooraniLetters.forEach((nChar, idx) => {
        const pair = nooraniToPair.get(nChar);
        if (pair) {
            positions.push({
                positionIndex: idx,
                nooraniLetter: nChar,
                nooraniLetterName: pair.nooraniLetterName,
                option1: {
                    char: pair.letter1.char,
                    name: pair.letter1.name,
                    score: pair.letter1.score
                },
                option2: {
                    char: pair.letter2.char,
                    name: pair.letter2.name,
                    score: pair.letter2.score
                }
            });

            primaryLetters.push(pair.letter1.char);
            primaryTotalScore += pair.letter1.score;

            secondaryLetters.push(pair.letter2.char);
            secondaryTotalScore += pair.letter2.score;
        } else {
            // Fallback for non-canonical
            primaryLetters.push(nChar);
            secondaryLetters.push(nChar);
        }
    });

    const N = positions.length;
    const totalPossibleCombinations = N > 0 ? Math.pow(2, N) : 0;

    // Generate combinations up to max 256 (N <= 8)
    const combinations: DecryptedCombination[] = [];
    const quranicWordsFound: DecryptedCombination[] = [];

    const maxCombinationsToGenerate = Math.min(totalPossibleCombinations, 512);

    for (let mask = 0; mask < maxCombinationsToGenerate; mask++) {
        const wordChars: string[] = [];
        const letterChoices: DecryptedCombination['letterChoices'] = [];
        let wordScore = 0;

        for (let i = 0; i < N; i++) {
            const pos = positions[i];
            const bit = (mask >> (N - 1 - i)) & 1; // 0 = option1 (🥇), 1 = option2 (🥈)
            const chosen = bit === 0 ? pos.option1 : pos.option2;
            const rank: 1 | 2 = bit === 0 ? 1 : 2;

            wordChars.push(chosen.char);
            wordScore += chosen.score;
            letterChoices.push({
                noorani: pos.nooraniLetter,
                chosenLetter: chosen.char,
                rank,
                score: chosen.score
            });
        }

        const assembledWord = wordChars.join('');
        const occurrences = quranLexicon ? (quranLexicon.get(assembledWord) || 0) : 0;
        const isQuranic = occurrences > 0;

        const comboItem: DecryptedCombination = {
            word: assembledWord,
            letterChoices,
            totalScore: Math.round(wordScore * 10) / 10,
            isQuranicWord: isQuranic,
            quranicOccurrences: occurrences
        };

        combinations.push(comboItem);

        if (isQuranic) {
            quranicWordsFound.push(comboItem);
        }
    }

    // Sort Quranic words by frequency descending
    quranicWordsFound.sort((a, b) => b.quranicOccurrences - a.quranicOccurrences);

    // Sort general combinations by total score descending
    combinations.sort((a, b) => {
        if (a.isQuranicWord && !b.isQuranicWord) return -1;
        if (!a.isQuranicWord && b.isQuranicWord) return 1;
        return b.totalScore - a.totalScore;
    });

    return {
        inputCipher: cipherInput,
        cleanCipher,
        nooraniLetters,
        isValidNooraniOnly,
        invalidLetters,
        primaryDecodedWord: primaryLetters.join(''),
        primaryTotalScore: Math.round(primaryTotalScore * 10) / 10,
        secondaryDecodedWord: secondaryLetters.join(''),
        secondaryTotalScore: Math.round(secondaryTotalScore * 10) / 10,
        positions,
        combinations,
        quranicWordsFound,
        totalPossibleCombinations
    };
}
