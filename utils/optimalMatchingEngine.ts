import { ARABIC_ALPHABET_28, CANONICAL_14_NOORANI_LETTERS, NooraniCipherNode } from './nooraniCipherEngine';

export interface Optimal2LetterAssignment {
    nooraniLetter: string;
    nooraniLetterName: string;
    fawatihSurahsCount: number;
    letter1: {
        char: string;
        name: string;
        score: number;
        originalRank: number;
        attachmentCount: number;
        inWordCount: number;
        justification: string;
    };
    letter2: {
        char: string;
        name: string;
        score: number;
        originalRank: number;
        attachmentCount: number;
        inWordCount: number;
        justification: string;
    };
    totalPairScore: number;
}

export interface OptimalPartitionResult {
    assignments: Optimal2LetterAssignment[];
    assignedLettersSet: Set<string>;
    all28Covered: boolean;
    coverageCount: number; // should be 28
    totalScore: number;
    method: 'hungarian_global_optimum' | 'greedy_priority';
}

/**
 * Solves the 14-to-28 Maximum Weight Matching Problem where:
 * - 14 Noorani letters each receive exactly 2 unique Arabic alphabet letters.
 * - All 28 Arabic alphabet letters are assigned with NO duplicates and NO omissions.
 */
export function computeOptimal14x2Partition(
    nodes: NooraniCipherNode[],
    method: 'hungarian_global_optimum' | 'greedy_priority' = 'hungarian_global_optimum'
): OptimalPartitionResult {
    if (nodes.length === 0) {
        return {
            assignments: [],
            assignedLettersSet: new Set(),
            all28Covered: false,
            coverageCount: 0,
            totalScore: 0,
            method
        };
    }

    // Ensure we strictly evaluate the 14 canonical Noorani letters (14 x 2 = 28 slots)
    const canonicalSet = new Set(CANONICAL_14_NOORANI_LETTERS.map(c => c.letter));
    const targetNodes = nodes.filter(n => canonicalSet.has(n.nooraniLetter));
    if (targetNodes.length === 0) {
        return {
            assignments: [],
            assignedLettersSet: new Set(),
            all28Covered: false,
            coverageCount: 0,
            totalScore: 0,
            method
        };
    }

    // Map each alphabet letter to its name
    const letterNameMap = new Map<string, string>();
    ARABIC_ALPHABET_28.forEach(a => letterNameMap.set(a.letter, a.name));

    // Matrix of scores: Noorani Node -> Alphabet Char -> Candidate Details
    const candidateMap = new Map<string, Map<string, {
        score: number;
        rank: number;
        attach: number;
        inWord: number;
        reason: string;
    }>>();

    targetNodes.forEach(n => {
        const charMap = new Map<string, { score: number; rank: number; attach: number; inWord: number; reason: string }>();
        n.allCandidates.forEach(c => {
            charMap.set(c.letter, {
                score: c.score,
                rank: c.rank,
                attach: c.attachmentCount,
                inWord: c.inWordCount,
                reason: c.justification
            });
        });
        candidateMap.set(n.nooraniLetter, charMap);
    });

    // 14 Noorani letters duplicate to 28 slots (each Noorani has slot A and slot B)
    const nooraniSlots: { nooraniLetter: string; slotIdx: number }[] = [];
    targetNodes.forEach(n => {
        nooraniSlots.push({ nooraniLetter: n.nooraniLetter, slotIdx: 1 });
        nooraniSlots.push({ nooraniLetter: n.nooraniLetter, slotIdx: 2 });
    });

    const all28Letters = ARABIC_ALPHABET_28.map(a => a.letter);

    let finalPairings: Map<string, string[]> = new Map(); // Noorani -> [Letter1, Letter2]
    targetNodes.forEach(n => finalPairings.set(n.nooraniLetter, []));

    if (method === 'greedy_priority') {
        // Greedy assignment: sort all possible (Noorani, Alphabet) pairs by score descending
        const allEdges: { noorani: string; alphabet: string; score: number }[] = [];
        targetNodes.forEach(n => {
            const m = candidateMap.get(n.nooraniLetter);
            all28Letters.forEach(a => {
                const item = m?.get(a);
                allEdges.push({
                    noorani: n.nooraniLetter,
                    alphabet: a,
                    score: item ? item.score : 0
                });
            });
        });

        allEdges.sort((e1, e2) => e2.score - e1.score);

        const usedAlphabet = new Set<string>();
        const nooraniCounts = new Map<string, number>();
        targetNodes.forEach(n => nooraniCounts.set(n.nooraniLetter, 0));

        allEdges.forEach(edge => {
            if (!usedAlphabet.has(edge.alphabet) && (nooraniCounts.get(edge.noorani) || 0) < 2) {
                usedAlphabet.add(edge.alphabet);
                nooraniCounts.set(edge.noorani, (nooraniCounts.get(edge.noorani) || 0) + 1);
                finalPairings.get(edge.noorani)?.push(edge.alphabet);
            }
        });

        // Ensure any unassigned alphabet letters get assigned to nodes that still have room
        const remainingAlphabet = all28Letters.filter(a => !usedAlphabet.has(a));
        remainingAlphabet.forEach(a => {
            for (const n of targetNodes) {
                if ((finalPairings.get(n.nooraniLetter)?.length || 0) < 2) {
                    finalPairings.get(n.nooraniLetter)?.push(a);
                    usedAlphabet.add(a);
                    break;
                }
            }
        });
    } else {
        // Global Maximum Weight Bipartite Matching using Successive Shortest Path (Hungarian / Min-Cost Max-Flow)
        // 28 Slots (14 nodes * 2) to 28 Alphabet letters
        const N = 28;
        // Cost matrix where cost = MAX_SCORE - score (to minimize cost)
        let maxVal = 0;
        targetNodes.forEach(n => {
            const m = candidateMap.get(n.nooraniLetter);
            all28Letters.forEach(a => {
                const s = m?.get(a)?.score || 0;
                if (s > maxVal) maxVal = s;
            });
        });
        maxVal += 10;

        const costMatrix: number[][] = [];
        for (let i = 0; i < N; i++) {
            costMatrix[i] = [];
            const nLetter = nooraniSlots[i].nooraniLetter;
            const m = candidateMap.get(nLetter);
            for (let j = 0; j < N; j++) {
                const aLetter = all28Letters[j];
                const s = m?.get(aLetter)?.score || 0;
                costMatrix[i][j] = maxVal - s;
            }
        }

        // Hungarian Algorithm (Kuhn-Munkres) for N=28
        const u = new Array(N + 1).fill(0);
        const v = new Array(N + 1).fill(0);
        const p = new Array(N + 1).fill(0);
        const way = new Array(N + 1).fill(0);

        for (let i = 1; i <= N; i++) {
            p[0] = i;
            let j0 = 0;
            const minv = new Array(N + 1).fill(Infinity);
            const used = new Array(N + 1).fill(false);

            do {
                used[j0] = true;
                const i0 = p[j0];
                let delta = Infinity;
                let j1 = 0;

                for (let j = 1; j <= N; j++) {
                    if (!used[j]) {
                        const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
                        if (cur < minv[j]) {
                            minv[j] = cur;
                            way[j] = j0;
                        }
                        if (minv[j] < delta) {
                            delta = minv[j];
                            j1 = j;
                        }
                    }
                }

                for (let j = 0; j <= N; j++) {
                    if (used[j]) {
                        u[p[j]] += delta;
                        v[j] -= delta;
                    } else {
                        minv[j] -= delta;
                    }
                }
                j0 = j1;
            } while (p[j0] !== 0);

            do {
                const j1 = way[j0];
                p[j0] = p[j1];
                j0 = j1;
            } while (j0 !== 0);
        }

        // Extract assignments: for each alphabet letter j (1..N), assigned slot is p[j]
        for (let j = 1; j <= N; j++) {
            const slotIdx = p[j] - 1; // 0..27
            const nLetter = nooraniSlots[slotIdx].nooraniLetter;
            const aLetter = all28Letters[j - 1];
            finalPairings.get(nLetter)?.push(aLetter);
        }
    }

    // Build the final formatted 14 rows
    const assignments: Optimal2LetterAssignment[] = [];
    const assignedLettersSet = new Set<string>();
    let totalScore = 0;

    targetNodes.forEach(n => {
        const rawLetters = finalPairings.get(n.nooraniLetter) || [];
        const m = candidateMap.get(n.nooraniLetter);

        // Sort the 2 assigned letters so higher score comes first
        rawLetters.sort((a, b) => {
            const sA = m?.get(a)?.score || 0;
            const sB = m?.get(b)?.score || 0;
            return sB - sA;
        });

        const l1Char = rawLetters[0] || '؟';
        const l2Char = rawLetters[1] || '؟';

        assignedLettersSet.add(l1Char);
        assignedLettersSet.add(l2Char);

        const l1Data = m?.get(l1Char);
        const l2Data = m?.get(l2Char);

        const s1 = l1Data?.score || 0;
        const s2 = l2Data?.score || 0;
        totalScore += s1 + s2;

        assignments.push({
            nooraniLetter: n.nooraniLetter,
            nooraniLetterName: n.nooraniLetterName.replace(' (واو القسم المقترنة بـ ن، ق، ص)', ''),
            fawatihSurahsCount: n.fawatihSurahs.length,
            letter1: {
                char: l1Char,
                name: letterNameMap.get(l1Char) || l1Char,
                score: s1,
                originalRank: l1Data?.rank || 0,
                attachmentCount: l1Data?.attach || 0,
                inWordCount: l1Data?.inWord || 0,
                justification: l1Data?.reason || 'أعلى استحقاق تفضيلي متوازن'
            },
            letter2: {
                char: l2Char,
                name: letterNameMap.get(l2Char) || l2Char,
                score: s2,
                originalRank: l2Data?.rank || 0,
                attachmentCount: l2Data?.attach || 0,
                inWordCount: l2Data?.inWord || 0,
                justification: l2Data?.reason || 'ثاني أعلى استحقاق تفضيلي متوازن'
            },
            totalPairScore: Math.round((s1 + s2) * 10) / 10
        });
    });

    return {
        assignments,
        assignedLettersSet,
        all28Covered: assignedLettersSet.size === 28,
        coverageCount: assignedLettersSet.size,
        totalScore: Math.round(totalScore * 10) / 10,
        method
    };
}
