import type { SurahData } from '../types';
import { normalizeArabicText } from './text';

export interface DeservingLetterCandidate {
    letter: string;
    letterName: string;
    rank: number;
    score: number; // 0 - 100
    attachmentCount: number; // Direct adjacency count
    beforeCount: number;
    afterCount: number;
    inWordCount: number; // Appearing in same word
    fawatihCount: number; // Occurrences in 29 Fawatih surahs
    exampleWords: string[];
    justification: string;
}

export interface NooraniCipherNode {
    nooraniLetter: string;
    nooraniLetterName: string;
    fawatihSurahs: { number: number; name: string }[];
    totalOccurrences: number;
    top4: DeservingLetterCandidate[];
    allCandidates: DeservingLetterCandidate[];
    hasWawBond?: boolean;
    wawBondDetails?: string;
}

export interface NooraniCipherAnalysisOptions {
    includeWawBond: boolean; // Treat Waw specially or as 15th bridge for (ن، ق، ص)
    excludeSelf: boolean; // Whether the Noorani letter itself can be among the 4
    scope: 'all_quran' | 'fawatih_surahs_only';
    weightModel: 'balanced' | 'attachment_heavy' | 'fawatih_heavy';
}

export const CANONICAL_14_NOORANI_LETTERS = [
    { letter: 'ا', name: 'الألف', surahs: [2, 3, 7, 10, 11, 12, 13, 14, 15, 29, 30, 31, 32] },
    { letter: 'ل', name: 'اللام', surahs: [2, 3, 7, 10, 11, 12, 13, 14, 15, 29, 30, 31, 32] },
    { letter: 'م', name: 'الميم', surahs: [2, 3, 7, 13, 26, 28, 29, 30, 31, 32, 40, 41, 42, 43, 44, 45, 46] },
    { letter: 'ر', name: 'الراء', surahs: [10, 11, 12, 13, 14, 15] },
    { letter: 'ك', name: 'الكاف', surahs: [19] },
    { letter: 'ه', name: 'الهاء', surahs: [19, 20] },
    { letter: 'ي', name: 'الياء', surahs: [19, 36] },
    { letter: 'ع', name: 'العين', surahs: [19, 42] },
    { letter: 'ص', name: 'الصاد', surahs: [7, 19, 38] },
    { letter: 'ط', name: 'الطاء', surahs: [20, 26, 27, 28] },
    { letter: 'س', name: 'السين', surahs: [26, 27, 28, 36, 42] },
    { letter: 'ح', name: 'الحاء', surahs: [40, 41, 42, 43, 44, 45, 46] },
    { letter: 'ق', name: 'القاف', surahs: [42, 50] },
    { letter: 'ن', name: 'النون', surahs: [68] }
];

export const FAWATIH_29_SURAHS = [
    2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68
];

export const ARABIC_ALPHABET_28 = [
    { letter: 'ا', name: 'الألف' },
    { letter: 'ب', name: 'الباء' },
    { letter: 'ت', name: 'التاء' },
    { letter: 'ث', name: 'الثاء' },
    { letter: 'ج', name: 'الجيم' },
    { letter: 'ح', name: 'الحاء' },
    { letter: 'خ', name: 'الخاء' },
    { letter: 'د', name: 'الدال' },
    { letter: 'ذ', name: 'الذال' },
    { letter: 'ر', name: 'الراء' },
    { letter: 'ز', name: 'الزاي' },
    { letter: 'س', name: 'السين' },
    { letter: 'ش', name: 'الشين' },
    { letter: 'ص', name: 'الصاد' },
    { letter: 'ض', name: 'الضاد' },
    { letter: 'ط', name: 'الطاء' },
    { letter: 'ظ', name: 'الظاء' },
    { letter: 'ع', name: 'العين' },
    { letter: 'غ', name: 'الغين' },
    { letter: 'ف', name: 'الفاء' },
    { letter: 'ق', name: 'القاف' },
    { letter: 'ك', name: 'الكاف' },
    { letter: 'ل', name: 'اللام' },
    { letter: 'م', name: 'الميم' },
    { letter: 'ن', name: 'النون' },
    { letter: 'ه', name: 'الهاء' },
    { letter: 'و', name: 'الواو' },
    { letter: 'ي', name: 'الياء' },
];

const LETTER_NAME_MAP: Record<string, string> = {};
ARABIC_ALPHABET_28.forEach(item => {
    LETTER_NAME_MAP[item.letter] = item.name;
});

/**
 * Executes full statistical and textual reverse engineering
 * to find the top 4 deserving Arabic letters for each Noorani letter.
 */
export function executeNooraniCipherReverseEngineering(
    simpleCleanData: SurahData[],
    options: NooraniCipherAnalysisOptions,
    onProgress?: (percent: number, stepText: string) => void
): NooraniCipherNode[] {
    if (!simpleCleanData || simpleCleanData.length === 0) return [];

    const fawatihSet = new Set(FAWATIH_29_SURAHS);
    const surahsToScan = options.scope === 'fawatih_surahs_only'
        ? simpleCleanData.filter(s => fawatihSet.has(s.number))
        : simpleCleanData;

    // Determine letter list to evaluate: 14 canonical or 14 + Waw
    const targetNooraniList = [...CANONICAL_14_NOORANI_LETTERS];
    if (options.includeWawBond) {
        targetNooraniList.push({
            letter: 'و',
            name: 'الواو (واو القسم المقترنة بـ ن، ق، ص)',
            surahs: [38, 50, 68]
        });
    }

    // Prepare occurrence and co-occurrence accumulators
    const nooraniOccurrences: Record<string, number> = {};
    const pairAttachmentBefore: Record<string, Record<string, number>> = {};
    const pairAttachmentAfter: Record<string, Record<string, number>> = {};
    const pairInWord: Record<string, Record<string, number>> = {};
    const pairFawatih: Record<string, Record<string, number>> = {};
    const pairExamples: Record<string, Record<string, Set<string>>> = {};

    targetNooraniList.forEach(n => {
        const nChar = n.letter;
        nooraniOccurrences[nChar] = 0;
        pairAttachmentBefore[nChar] = {};
        pairAttachmentAfter[nChar] = {};
        pairInWord[nChar] = {};
        pairFawatih[nChar] = {};
        pairExamples[nChar] = {};

        ARABIC_ALPHABET_28.forEach(a => {
            const aChar = a.letter;
            pairAttachmentBefore[nChar][aChar] = 0;
            pairAttachmentAfter[nChar][aChar] = 0;
            pairInWord[nChar][aChar] = 0;
            pairFawatih[nChar][aChar] = 0;
            pairExamples[nChar][aChar] = new Set();
        });
    });

    const totalSurahs = surahsToScan.length;

    // Scan surahs and words
    surahsToScan.forEach((surah, sIdx) => {
        const isFawatihSurah = fawatihSet.has(surah.number);

        surah.ayahs.forEach(ayah => {
            const rawWords = ayah.text.split(/\s+/).filter(Boolean);

            rawWords.forEach(word => {
                const normWord = normalizeArabicText(word);
                if (!normWord) return;

                const chars = normWord.split('');
                const distinctChars = new Set(chars.filter(c => c.match(/[\u0621-\u064A]/)));

                targetNooraniList.forEach(n => {
                    const nChar = n.letter;
                    const nIndices: number[] = [];

                    chars.forEach((c, idx) => {
                        if (c === nChar) {
                            nIndices.push(idx);
                        }
                    });

                    if (nIndices.length > 0) {
                        nooraniOccurrences[nChar] += nIndices.length;

                        // Adjacency connections
                        nIndices.forEach(idx => {
                            // Preceding character (Before)
                            if (idx > 0) {
                                const beforeChar = chars[idx - 1];
                                if (pairAttachmentBefore[nChar][beforeChar] !== undefined) {
                                    pairAttachmentBefore[nChar][beforeChar]++;
                                    if (pairExamples[nChar][beforeChar].size < 4) {
                                        pairExamples[nChar][beforeChar].add(word);
                                    }
                                }
                            }

                            // Succeeding character (After)
                            if (idx < chars.length - 1) {
                                const afterChar = chars[idx + 1];
                                if (pairAttachmentAfter[nChar][afterChar] !== undefined) {
                                    pairAttachmentAfter[nChar][afterChar]++;
                                    if (pairExamples[nChar][afterChar].size < 4) {
                                        pairExamples[nChar][afterChar].add(word);
                                    }
                                }
                            }
                        });

                        // In-Word co-occurrence with all other distinct characters
                        distinctChars.forEach(otherChar => {
                            if (pairInWord[nChar][otherChar] !== undefined) {
                                pairInWord[nChar][otherChar]++;
                                if (isFawatihSurah) {
                                    pairFawatih[nChar][otherChar]++;
                                }
                                if (pairExamples[nChar][otherChar].size < 4) {
                                    pairExamples[nChar][otherChar].add(word);
                                }
                            }
                        });
                    }
                });
            });
        });
    });

    // Compute weights based on active model
    let wAttach = 0.45;
    let wInWord = 0.25;
    let wFawatih = 0.30;

    if (options.weightModel === 'attachment_heavy') {
        wAttach = 0.70;
        wInWord = 0.20;
        wFawatih = 0.10;
    } else if (options.weightModel === 'fawatih_heavy') {
        wAttach = 0.25;
        wInWord = 0.25;
        wFawatih = 0.50;
    }

    // Special Waw multiplier for (ن، ق، ص) if Waw bond is active
    const wawBonds: Record<string, string> = {
        'ن': 'مقترن بالواو في فاتحة سورة القلم: {ن ۚ وَالْقَلَمِ}',
        'ق': 'مقترن بالواو في فاتحة سورة ق: {ق ۚ وَالْقُرْآنِ الْمَجِيدِ}',
        'ص': 'مقترن بالواو في فاتحة سورة ص: {ص ۚ وَالْقُرْآنِ ذِي الذِّكْرِ}'
    };

    const results: NooraniCipherNode[] = targetNooraniList.map(nItem => {
        const nChar = nItem.letter;
        const totalNCount = nooraniOccurrences[nChar] || 1;

        // Raw metrics map for normalization
        let maxAttach = 1;
        let maxInWord = 1;
        let maxFawatih = 1;

        ARABIC_ALPHABET_28.forEach(a => {
            const aChar = a.letter;
            if (options.excludeSelf && aChar === nChar) return;

            const attachCount = (pairAttachmentBefore[nChar][aChar] || 0) + (pairAttachmentAfter[nChar][aChar] || 0);
            const inWord = pairInWord[nChar][aChar] || 0;
            const fawatih = pairFawatih[nChar][aChar] || 0;

            if (attachCount > maxAttach) maxAttach = attachCount;
            if (inWord > maxInWord) maxInWord = inWord;
            if (fawatih > maxFawatih) maxFawatih = fawatih;
        });

        // Compute candidates scores
        const candidates: DeservingLetterCandidate[] = ARABIC_ALPHABET_28
            .filter(a => !(options.excludeSelf && a.letter === nChar))
            .map(a => {
                const aChar = a.letter;
                const before = pairAttachmentBefore[nChar][aChar] || 0;
                const after = pairAttachmentAfter[nChar][aChar] || 0;
                const totalAttach = before + after;
                const inWord = pairInWord[nChar][aChar] || 0;
                const fawatih = pairFawatih[nChar][aChar] || 0;

                // Normalized scores between 0 and 1
                const sAttach = totalAttach / maxAttach;
                const sInWord = inWord / maxInWord;
                const sFawatih = fawatih / maxFawatih;

                let composite = (sAttach * wAttach + sInWord * wInWord + sFawatih * wFawatih) * 100;

                // Special boost for 'و' when analyzing (ن، ق، ص) if Waw bond is requested
                if (options.includeWawBond && aChar === 'و' && wawBonds[nChar]) {
                    composite = composite * 1.35; // boost due to Quranic Oath ligature bond
                }

                const score = Math.round(composite * 10) / 10;

                // Synthesize a precise justification
                let reason = '';
                if (totalAttach > 0) {
                    reason = `اتصال مباشر في ${totalAttach.toLocaleString('ar-SA')} موضعاً (قبل: ${before}، بعد: ${after})`;
                } else if (inWord > 0) {
                    reason = `اقتران في نفس الكلمة في ${inWord.toLocaleString('ar-SA')} موضعاً`;
                } else {
                    reason = `تردد متزامن في سور الفواتح`;
                }

                if (aChar === 'و' && wawBonds[nChar]) {
                    reason += ' + صلة قسم مباشرة في فاتحة السورة';
                }

                return {
                    letter: aChar,
                    letterName: a.name,
                    rank: 0,
                    score,
                    attachmentCount: totalAttach,
                    beforeCount: before,
                    afterCount: after,
                    inWordCount: inWord,
                    fawatihCount: fawatih,
                    exampleWords: Array.from(pairExamples[nChar][aChar] || []).slice(0, 3),
                    justification: reason
                };
            });

        // Sort descending by score
        candidates.sort((a, b) => b.score - a.score);

        // Assign rank numbers
        candidates.forEach((c, idx) => {
            c.rank = idx + 1;
        });

        const top4 = candidates.slice(0, 4);

        const surahObjects = nItem.surahs.map(sNum => {
            const match = simpleCleanData.find(s => s.number === sNum);
            return {
                number: sNum,
                name: match ? match.name : `سورة ${sNum}`
            };
        });

        return {
            nooraniLetter: nChar,
            nooraniLetterName: nItem.name,
            fawatihSurahs: surahObjects,
            totalOccurrences: nooraniOccurrences[nChar] || 0,
            top4,
            allCandidates: candidates,
            hasWawBond: !!wawBonds[nChar],
            wawBondDetails: wawBonds[nChar]
        };
    });

    return results;
}

/**
 * Decodes or encodes a word using the generated 14-to-4 cipher mapping.
 */
export function simulateCipherTranslation(
    text: string,
    cipherNodes: NooraniCipherNode[]
): {
    original: string;
    encodedToNoorani: string;
    cipherDetails: { char: string; mappedNoorani: string; rankMatch: number }[];
} {
    const norm = normalizeArabicText(text);
    if (!norm) return { original: text, encodedToNoorani: '', cipherDetails: [] };

    // Build reverse map: Arabic Letter -> Best Matching Noorani Letter
    const bestNooraniForArabic: Record<string, { noorani: string; rank: number }> = {};

    cipherNodes.forEach(node => {
        node.top4.forEach((cand, idx) => {
            const current = bestNooraniForArabic[cand.letter];
            // If not assigned, or this one has a higher rank/score
            if (!current || idx + 1 < current.rank) {
                bestNooraniForArabic[cand.letter] = {
                    noorani: node.nooraniLetter,
                    rank: idx + 1
                };
            }
        });
    });

    const details: { char: string; mappedNoorani: string; rankMatch: number }[] = [];
    const encodedChars: string[] = [];

    norm.split('').forEach(char => {
        if (bestNooraniForArabic[char]) {
            const mapping = bestNooraniForArabic[char];
            encodedChars.push(mapping.noorani);
            details.push({
                char,
                mappedNoorani: mapping.noorani,
                rankMatch: mapping.rank
            });
        } else {
            encodedChars.push(char);
            details.push({
                char,
                mappedNoorani: char,
                rankMatch: 0
            });
        }
    });

    return {
        original: text,
        encodedToNoorani: encodedChars.join(''),
        cipherDetails: details
    };
}

export interface LetterPairSimilarity {
    letterA: string;
    letterB: string;
    similarityScore: number; // 0 - 100%
    sharedTop4: string[];
    sharedTop8: string[];
    cosineSimilarity: number;
}

export interface SimilarityPairCluster {
    pairId: number;
    nodeA: NooraniCipherNode;
    nodeB: NooraniCipherNode;
    similarityScore: number;
    sharedTopLetters: string[];
}

/**
 * Computes the similarity score and shared candidate letters between two Noorani cipher nodes.
 */
export function computePairSimilarity(nodeA: NooraniCipherNode, nodeB: NooraniCipherNode): LetterPairSimilarity {
    // 1. Build score maps for all 28 alphabet letters
    const scoreMapA = new Map<string, number>();
    const scoreMapB = new Map<string, number>();

    nodeA.allCandidates.forEach(c => scoreMapA.set(c.letter, c.score));
    nodeB.allCandidates.forEach(c => scoreMapB.set(c.letter, c.score));

    // 2. Cosine similarity over the score vectors
    let dot = 0;
    let magA = 0;
    let magB = 0;

    ARABIC_ALPHABET_28.forEach(a => {
        const sa = scoreMapA.get(a.letter) || 0;
        const sb = scoreMapB.get(a.letter) || 0;
        dot += sa * sb;
        magA += sa * sa;
        magB += sb * sb;
    });

    const cosineSim = (magA > 0 && magB > 0) ? (dot / (Math.sqrt(magA) * Math.sqrt(magB))) : 0;

    // 3. Overlap in top candidates
    const top4A = new Set(nodeA.top4.map(c => c.letter));
    const top4B = new Set(nodeB.top4.map(c => c.letter));
    const sharedTop4 = nodeA.top4.filter(c => top4B.has(c.letter)).map(c => c.letter);

    const top8A = new Set(nodeA.allCandidates.slice(0, 8).map(c => c.letter));
    const top8B = new Set(nodeB.allCandidates.slice(0, 8).map(c => c.letter));
    const sharedTop8 = nodeA.allCandidates.slice(0, 8).filter(c => top8B.has(c.letter)).map(c => c.letter);

    // Composite similarity percentage (weighted 65% cosine profile + 35% top candidate overlaps)
    const jaccardTop8 = (sharedTop8.length / Math.max(1, 16 - sharedTop8.length));
    const rawScore = (cosineSim * 0.65 + jaccardTop8 * 0.35) * 100;
    const similarityScore = Math.min(100, Math.round(rawScore * 10) / 10);

    return {
        letterA: nodeA.nooraniLetter,
        letterB: nodeB.nooraniLetter,
        similarityScore,
        sharedTop4,
        sharedTop8,
        cosineSimilarity: Math.round(cosineSim * 1000) / 10
    };
}

/**
 * Clusters Noorani letters into mutual twin pairs sorted directly under each other
 * based on highest correlation/overlap in their connected alphabet letters.
 */
export function clusterNodesBySimilarityPairs(nodes: NooraniCipherNode[]): {
    sortedNodes: NooraniCipherNode[];
    pairs: SimilarityPairCluster[];
    similarityMatrix: Record<string, Record<string, number>>;
    bestPartnerMap: Record<string, { partnerLetter: string; similarity: number; sharedLetters: string[] }>;
} {
    // 1. Build complete pairwise similarity matrix
    const matrix: Record<string, Record<string, number>> = {};
    const pairCache = new Map<string, LetterPairSimilarity>();

    nodes.forEach(n1 => {
        matrix[n1.nooraniLetter] = {};
        nodes.forEach(n2 => {
            if (n1.nooraniLetter === n2.nooraniLetter) {
                matrix[n1.nooraniLetter][n2.nooraniLetter] = 100;
            } else {
                const key = [n1.nooraniLetter, n2.nooraniLetter].sort().join('-');
                let sim = pairCache.get(key);
                if (!sim) {
                    sim = computePairSimilarity(n1, n2);
                    pairCache.set(key, sim);
                }
                matrix[n1.nooraniLetter][n2.nooraniLetter] = sim.similarityScore;
            }
        });
    });

    // 2. Determine best partner for each letter
    const bestPartnerMap: Record<string, { partnerLetter: string; similarity: number; sharedLetters: string[] }> = {};
    nodes.forEach(n1 => {
        let bestScore = -1;
        let bestPartner = '';
        let bestShared: string[] = [];

        nodes.forEach(n2 => {
            if (n1.nooraniLetter !== n2.nooraniLetter) {
                const key = [n1.nooraniLetter, n2.nooraniLetter].sort().join('-');
                const sim = pairCache.get(key)!;
                if (sim.similarityScore > bestScore) {
                    bestScore = sim.similarityScore;
                    bestPartner = n2.nooraniLetter;
                    bestShared = sim.sharedTop8;
                }
            }
        });

        bestPartnerMap[n1.nooraniLetter] = {
            partnerLetter: bestPartner,
            similarity: bestScore,
            sharedLetters: bestShared
        };
    });

    // 3. Greedy Maximum Weight Matching to form distinct pairs
    const visited = new Set<string>();
    const pairs: SimilarityPairCluster[] = [];
    const sortedNodes: NooraniCipherNode[] = [];

    // All possible distinct pairs sorted descending by similarity
    const allPairsList: { a: NooraniCipherNode; b: NooraniCipherNode; sim: LetterPairSimilarity }[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nA = nodes[i];
            const nB = nodes[j];
            const key = [nA.nooraniLetter, nB.nooraniLetter].sort().join('-');
            const sim = pairCache.get(key)!;
            allPairsList.push({ a: nA, b: nB, sim });
        }
    }
    allPairsList.sort((p1, p2) => p2.sim.similarityScore - p1.sim.similarityScore);

    let pairCounter = 1;
    for (const item of allPairsList) {
        if (!visited.has(item.a.nooraniLetter) && !visited.has(item.b.nooraniLetter)) {
            visited.add(item.a.nooraniLetter);
            visited.add(item.b.nooraniLetter);

            pairs.push({
                pairId: pairCounter++,
                nodeA: item.a,
                nodeB: item.b,
                similarityScore: item.sim.similarityScore,
                sharedTopLetters: item.sim.sharedTop8
            });

            // Put them directly under each other:
            sortedNodes.push(item.a);
            sortedNodes.push(item.b);
        }
    }

    // Add any remaining unvisited nodes (if odd count)
    nodes.forEach(n => {
        if (!visited.has(n.nooraniLetter)) {
            sortedNodes.push(n);
        }
    });

    return {
        sortedNodes,
        pairs,
        similarityMatrix: matrix,
        bestPartnerMap
    };
}
