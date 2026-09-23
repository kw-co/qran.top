import React, { useState, useEffect, useMemo } from 'react';
import type { SurahData } from '../types';
import { 
    executeNooraniCipherReverseEngineering,
    simulateCipherTranslation,
    NooraniCipherNode,
    NooraniCipherAnalysisOptions,
    CANONICAL_14_NOORANI_LETTERS,
    ARABIC_ALPHABET_28,
    clusterNodesBySimilarityPairs
} from '../utils/nooraniCipherEngine';
import { 
    computeOptimal14x2Partition,
    Optimal2LetterAssignment,
    OptimalPartitionResult
} from '../utils/optimalMatchingEngine';
import NooraniCipherLab from './NooraniCipherLab';
import { 
    SparklesIcon, 
    ChevronLeftIcon,
    ClearIcon,
    CopyIcon,
    CheckIcon,
    DownloadIcon
} from './icons';

interface NooraniReverseCipherViewProps {
    simpleCleanData: SurahData[];
}

type MainTab = 'preferential_14x2' | 'full_matrix' | 'playground';
type SortMode = 'similarity_pairs' | 'standard' | 'similarity_to_active';
type TableStyle = 'ranking' | 'heatmap';

export type PreferentialSortMode = 
    | 'total_score_desc'
    | 'total_score_asc'
    | 'primary_score_desc'
    | 'distinctiveness_desc'
    | 'fawatih_freq_desc'
    | 'quran_total_freq_desc'
    | 'mushaf_order'
    | 'alphabetical'
    | 'similarity_twins';

export type PreferentialViewMode = 'standard_14_rows' | 'quad_7_pairs';
export type QuadPairingMethod = 'noorani_nr' | 'similarity_twins' | 'fawatih_cooccurrence' | 'score_desc';
export type ExportCodeFormat = 'arabic_cipher_v2' | 'json' | 'python' | 'typescript' | 'markdown' | 'csv';
export type ArabicLetterContentMode = 'quranic_optimal' | 'alphabetical_standard';
export type LayerDirectionMode = 'desc_7_to_1' | 'asc_1_to_7';

// Standard 28 Arabic letters distributed across 7 layers (4 letters per layer) matching the Arabic Cipher software
export const ALPHABETICAL_7_LAYERS: Record<number, string> = {
    7: 'أ ب ت ث',
    6: 'ج ح خ د',
    5: 'ذ ر ز س',
    4: 'ش ص ض ط',
    3: 'ظ ع غ ف',
    2: 'ق ك ل م',
    1: 'ن ه و ي'
};

export interface NooraniPairQuad {
    pairId: number;
    letterA: string;
    letterAName: string;
    letterB: string;
    letterBName: string;
    relationship: string;
    similarityScore?: number;
    quadLetters: {
        char: string;
        name: string;
        score: number;
        fromNoorani: string;
        originalRank: number;
        attachmentCount: number;
        inWordCount: number;
        justification: string;
    }[];
    totalQuadScore: number;
}

// First appearance order of Noorani letters across Surahs
const NOORANI_MUSHAF_ORDER: Record<string, number> = {
    'ا': 1, 'ل': 2, 'م': 3, 'ص': 4, 'ر': 5, 'ك': 6, 'ه': 7, 
    'ي': 8, 'ع': 9, 'ط': 10, 'س': 11, 'ح': 12, 'ق': 13, 'ن': 14
};

// Standard Arabic Alphabetical order for the 14 Noorani letters
const NOORANI_ALPHABETICAL_ORDER: Record<string, number> = {
    'ا': 1, 'ح': 2, 'ر': 3, 'س': 4, 'ص': 5, 'ط': 6, 'ع': 7, 
    'ق': 8, 'ك': 9, 'ل': 10, 'م': 11, 'ن': 12, 'ه': 13, 'ي': 14
};

export const NooraniReverseCipherView: React.FC<NooraniReverseCipherViewProps> = ({
    simpleCleanData
}) => {
    // 1. Navigation / Primary Tab State
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('preferential_14x2');

    // 2. Loading & Multi-Step Progress Bar State
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressStepText, setProgressStepText] = useState<string>('بدء تهيئة محرك الهندسة العكسية والتوزيع الأمثل...');

    // 3. Options State
    const [includeWawBond, setIncludeWawBond] = useState<boolean>(true);
    const [excludeSelf, setExcludeSelf] = useState<boolean>(true);
    const [scope, setScope] = useState<'all_quran' | 'fawatih_surahs_only'>('all_quran');
    const [weightModel, setWeightModel] = useState<'balanced' | 'attachment_heavy' | 'fawatih_heavy'>('balanced');
    const [matchingMethod, setMatchingMethod] = useState<'hungarian_global_optimum' | 'greedy_priority'>('hungarian_global_optimum');

    // 4. Computed Cipher Data
    const [cipherResults, setCipherResults] = useState<NooraniCipherNode[]>([]);
    const [selectedNodeLetter, setSelectedNodeLetter] = useState<string>('ح');

    // 5. Preferential 14x2 Sorting, Views & Export State
    const [preferentialSortMode, setPreferentialSortMode] = useState<PreferentialSortMode>('total_score_desc');
    const [preferentialViewMode, setPreferentialViewMode] = useState<PreferentialViewMode>('standard_14_rows');
    const [quadPairingMethod, setQuadPairingMethod] = useState<QuadPairingMethod>('noorani_nr');
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<ExportCodeFormat>('arabic_cipher_v2');
    const [layerDirection, setLayerDirection] = useState<LayerDirectionMode>('desc_7_to_1');
    const [arabicContentMode, setArabicContentMode] = useState<ArabicLetterContentMode>('quranic_optimal');
    const [customNooraniOrderName, setCustomNooraniOrderName] = useState<string>('');
    const [customArabicOrderName, setCustomArabicOrderName] = useState<string>('');
    const [modalSubTab, setModalSubTab] = useState<'code' | 'visual_preview'>('code');
    const [copiedExport, setCopiedExport] = useState<boolean>(false);
    const [downloadedExport, setDownloadedExport] = useState<boolean>(false);

    // 6. View & Sort Controls for Full Matrix
    const [sortMode, setSortMode] = useState<SortMode>('similarity_pairs');
    const [columnsLimit, setColumnsLimit] = useState<number>(28);
    const [tableStyle, setTableStyle] = useState<TableStyle>('ranking');
    const [focusCandidatesLimit, setFocusCandidatesLimit] = useState<number>(4);
    const [showSimilarityMatrix, setShowSimilarityMatrix] = useState<boolean>(false);

    // 7. Decryptor / Simulation State
    const [testWord, setTestWord] = useState<string>('محمد');
    const [copied, setCopied] = useState<boolean>(false);

    // Scroll to top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 7. Heavy Processing Simulation with Real Calculation
    const runAnalysis = () => {
        setIsProcessing(true);
        setProgressPercent(15);
        setProgressStepText('1/4: مسح معجم ألفاظ المصحف الشريف واستخراج الحروف النورانية الـ 14...');

        setTimeout(() => {
            setProgressPercent(40);
            setProgressStepText('2/4: تحليل اقتران وتلاصق الأحرف الـ 28 وتتبع صلة الواو بـ (ن، ق، ص)...');

            setTimeout(() => {
                setProgressPercent(75);
                setProgressStepText('3/4: تشغيل خوارزمية التعيين التفضيلي الأقصى (14 نوراني ↔ 28 أبجدي كاملة)...');

                setTimeout(() => {
                    const options: NooraniCipherAnalysisOptions = {
                        includeWawBond,
                        excludeSelf,
                        scope,
                        weightModel
                    };
                    const res = executeNooraniCipherReverseEngineering(simpleCleanData, options);
                    setCipherResults(res);
                    setProgressPercent(100);
                    setProgressStepText('4/4: اكتمل حساب الجدول التفضيلي المزدوج وتوزيع الأبجدية كاملة بنجاح!');

                    setTimeout(() => {
                        setIsProcessing(false);
                    }, 350);
                }, 250);
            }, 250);
        }, 250);
    };

    // Run on initial mount and when options change
    useEffect(() => {
        if (simpleCleanData && simpleCleanData.length > 0) {
            runAnalysis();
        }
    }, [simpleCleanData, includeWawBond, excludeSelf, scope, weightModel]);

    // 8. Optimal 14x2 Bipartite Partition Calculation (The Core User Request)
    const optimalPartition: OptimalPartitionResult = useMemo(() => {
        if (cipherResults.length === 0) {
            return {
                assignments: [],
                assignedLettersSet: new Set(),
                all28Covered: false,
                coverageCount: 0,
                totalScore: 0,
                method: matchingMethod
            };
        }
        return computeOptimal14x2Partition(cipherResults, matchingMethod);
    }, [cipherResults, matchingMethod]);

    // Reverse lookup map: from Arabic letter to its assigned Noorani letter
    const alphabetToNooraniMap = useMemo(() => {
        const map = new Map<string, string>();
        optimalPartition.assignments.forEach(a => {
            map.set(a.letter1.char, a.nooraniLetter);
            map.set(a.letter2.char, a.nooraniLetter);
        });
        return map;
    }, [optimalPartition]);

    // 9. Calculate Pairwise Similarities and Cluster Twins for Full Table
    const similarityData = useMemo(() => {
        if (cipherResults.length === 0) {
            return {
                sortedNodes: [],
                pairs: [],
                similarityMatrix: {},
                bestPartnerMap: {}
            };
        }
        return clusterNodesBySimilarityPairs(cipherResults);
    }, [cipherResults]);

    // 10. Sorted Assignments for the 14x2 Preferential Table
    const sortedAssignments = useMemo(() => {
        if (!optimalPartition.assignments || optimalPartition.assignments.length === 0) return [];
        const list = [...optimalPartition.assignments];

        const occurrencesMap = new Map<string, number>();
        cipherResults.forEach(c => occurrencesMap.set(c.nooraniLetter, c.totalOccurrences));

        switch (preferentialSortMode) {
            case 'total_score_desc':
                return list.sort((a, b) => b.totalPairScore - a.totalPairScore);
            case 'total_score_asc':
                return list.sort((a, b) => a.totalPairScore - b.totalPairScore);
            case 'primary_score_desc':
                return list.sort((a, b) => b.letter1.score - a.letter1.score);
            case 'distinctiveness_desc':
                return list.sort((a, b) => {
                    const deltaA = a.letter1.score - a.letter2.score;
                    const deltaB = b.letter1.score - b.letter2.score;
                    return deltaB - deltaA;
                });
            case 'fawatih_freq_desc':
                return list.sort((a, b) => b.fawatihSurahsCount - a.fawatihSurahsCount);
            case 'quran_total_freq_desc':
                return list.sort((a, b) => (occurrencesMap.get(b.nooraniLetter) || 0) - (occurrencesMap.get(a.nooraniLetter) || 0));
            case 'mushaf_order':
                return list.sort((a, b) => (NOORANI_MUSHAF_ORDER[a.nooraniLetter] || 99) - (NOORANI_MUSHAF_ORDER[b.nooraniLetter] || 99));
            case 'alphabetical':
                return list.sort((a, b) => (NOORANI_ALPHABETICAL_ORDER[a.nooraniLetter] || 99) - (NOORANI_ALPHABETICAL_ORDER[b.nooraniLetter] || 99));
            case 'similarity_twins': {
                const indexMap = new Map<string, number>();
                similarityData.sortedNodes.forEach((node, i) => indexMap.set(node.nooraniLetter, i));
                return list.sort((a, b) => (indexMap.get(a.nooraniLetter) ?? 99) - (indexMap.get(b.nooraniLetter) ?? 99));
            }
            default:
                return list;
        }
    }, [optimalPartition.assignments, preferentialSortMode, cipherResults, similarityData]);

    // 11. 7-Pairs Quad Structure (2 Noorani Letters ↔ 4 Arabic Letters = 28 Complete Alphabet)
    const nooraniQuadPairs = useMemo<NooraniPairQuad[]>(() => {
        if (!optimalPartition.assignments || optimalPartition.assignments.length === 0) return [];

        const assignmentMap = new Map<string, Optimal2LetterAssignment>();
        optimalPartition.assignments.forEach(a => assignmentMap.set(a.nooraniLetter, a));

        const nameMap = new Map<string, string>();
        CANONICAL_14_NOORANI_LETTERS.forEach(c => nameMap.set(c.letter, c.name));

        // Define the 7 pairs according to the chosen quad grouping method
        let pairsList: { letterA: string; letterB: string; relation: string; similarity?: number }[] = [];

        if (quadPairingMethod === 'noorani_nr') {
            // Exact layer pairing from user's "Arabic Cipher" (التشفير العربي) software (Layers 7 down to 1)
            pairsList = [
                { letterA: 'ن', letterB: 'ق', relation: 'الطبقة 7 في التشفير العربي (سماء 7: ن ق)' },
                { letterA: 'ص', letterB: 'ح', relation: 'الطبقة 6 في التشفير العربي (سماء 6: ص ح)' },
                { letterA: 'م', letterB: 'ي', relation: 'الطبقة 5 في التشفير العربي (سماء 5: م ي)' },
                { letterA: 'س', letterB: 'ط', relation: 'الطبقة 4 في التشفير العربي (سماء 4: س ط)' },
                { letterA: 'ه', letterB: 'ا', relation: 'الطبقة 3 في التشفير العربي (سماء 3: ه ا)' },
                { letterA: 'ل', letterB: 'ر', relation: 'الطبقة 2 في التشفير العربي (سماء 2: ل ر)' },
                { letterA: 'ع', letterB: 'ك', relation: 'الطبقة 1 في التشفير العربي (سماء 1: ع ك)' }
            ];
        } else if (quadPairingMethod === 'fawatih_cooccurrence') {
            pairsList = [
                { letterA: 'ا', letterB: 'ل', relation: 'اقتران الفواتح الأعظم (الم، الر، المر في 13 سورة)' },
                { letterA: 'ط', letterB: 'س', relation: 'اقتران الطواسين الشقيقين (طسم، طس في 3 سور)' },
                { letterA: 'ح', letterB: 'م', relation: 'اقتران الحواميم السبعة المباركة (حم، حمعسق)' },
                { letterA: 'ك', letterB: 'ه', relation: 'اقتران مفتتح سورة مريم (كهيعص)' },
                { letterA: 'ي', letterB: 'ع', relation: 'اقتران أواسط مريم والشورى (كهيعص، حمعسق)' },
                { letterA: 'ص', letterB: 'ر', relation: 'اقتران فواتح الراء والصاد (المص، المر، ص)' },
                { letterA: 'ق', letterB: 'ن', relation: 'اقتران فواتح القسم والحروف المفردة (ن، ق، عسق)' }
            ];
        } else {
            // 'similarity_twins' or 'score_desc' (based on similarity clustering)
            if (similarityData.pairs && similarityData.pairs.length > 0) {
                pairsList = similarityData.pairs.map(p => ({
                    letterA: p.nodeA.nooraniLetter,
                    letterB: p.nodeB.nooraniLetter,
                    relation: `توأمة إحصائية (نسبة تشابه ${p.similarityScore}%)`,
                    similarity: p.similarityScore
                }));
            } else {
                pairsList = [
                    { letterA: 'ط', letterB: 'س', relation: 'توأمة إحصائية' },
                    { letterA: 'ح', letterB: 'م', relation: 'توأمة إحصائية' },
                    { letterA: 'ك', letterB: 'ي', relation: 'توأمة إحصائية' },
                    { letterA: 'ع', letterB: 'ص', relation: 'توأمة إحصائية' },
                    { letterA: 'ا', letterB: 'ل', relation: 'توأمة إحصائية' },
                    { letterA: 'ر', letterB: 'ق', relation: 'توأمة إحصائية' },
                    { letterA: 'ن', letterB: 'ه', relation: 'توأمة إحصائية' }
                ];
            }
        }

        const quads: NooraniPairQuad[] = [];

        pairsList.forEach((p, idx) => {
            const itemA = assignmentMap.get(p.letterA);
            const itemB = assignmentMap.get(p.letterB);

            if (!itemA || !itemB) return;

            // Collect the 4 letters: 2 from itemA and 2 from itemB
            const rawLetters = [
                {
                    char: itemA.letter1.char,
                    name: itemA.letter1.name,
                    score: itemA.letter1.score,
                    fromNoorani: itemA.nooraniLetter,
                    originalRank: itemA.letter1.originalRank,
                    attachmentCount: itemA.letter1.attachmentCount,
                    inWordCount: itemA.letter1.inWordCount,
                    justification: itemA.letter1.justification
                },
                {
                    char: itemA.letter2.char,
                    name: itemA.letter2.name,
                    score: itemA.letter2.score,
                    fromNoorani: itemA.nooraniLetter,
                    originalRank: itemA.letter2.originalRank,
                    attachmentCount: itemA.letter2.attachmentCount,
                    inWordCount: itemA.letter2.inWordCount,
                    justification: itemA.letter2.justification
                },
                {
                    char: itemB.letter1.char,
                    name: itemB.letter1.name,
                    score: itemB.letter1.score,
                    fromNoorani: itemB.nooraniLetter,
                    originalRank: itemB.letter1.originalRank,
                    attachmentCount: itemB.letter1.attachmentCount,
                    inWordCount: itemB.letter1.inWordCount,
                    justification: itemB.letter1.justification
                },
                {
                    char: itemB.letter2.char,
                    name: itemB.letter2.name,
                    score: itemB.letter2.score,
                    fromNoorani: itemB.nooraniLetter,
                    originalRank: itemB.letter2.originalRank,
                    attachmentCount: itemB.letter2.attachmentCount,
                    inWordCount: itemB.letter2.inWordCount,
                    justification: itemB.letter2.justification
                }
            ];

            // Sort the 4 letters descending by score: 1st, 2nd, 3rd, 4th
            rawLetters.sort((x, y) => y.score - x.score);

            const totalQuadScore = Math.round((itemA.totalPairScore + itemB.totalPairScore) * 10) / 10;

            quads.push({
                pairId: idx + 1,
                letterA: p.letterA,
                letterAName: nameMap.get(p.letterA) || itemA.nooraniLetterName,
                letterB: p.letterB,
                letterBName: nameMap.get(p.letterB) || itemB.nooraniLetterName,
                relationship: p.relation,
                similarityScore: p.similarity,
                quadLetters: rawLetters,
                totalQuadScore
            });
        });

        if (quadPairingMethod === 'score_desc') {
            quads.sort((a, b) => b.totalQuadScore - a.totalQuadScore);
            quads.forEach((q, i) => { q.pairId = i + 1; });
        }

        return quads;
    }, [optimalPartition.assignments, quadPairingMethod, similarityData]);

    // 12. Export Code Generator (for external programs: Arabic Cipher v2, Python, TypeScript, JSON, Markdown, CSV)
    const exportCodeText = useMemo(() => {
        if (nooraniQuadPairs.length === 0) return '';

        // FORMAT 1: EXACT MATCH WITH "التشفير العربي" (Arabic Cipher v2.0)
        if (exportFormat === 'arabic_cipher_v2') {
            const layers = nooraniQuadPairs.map((q, idx) => {
                const layerNum = layerDirection === 'desc_7_to_1' ? (7 - idx) : (idx + 1);

                let arabicLettersStr = '';
                if (arabicContentMode === 'alphabetical_standard') {
                    arabicLettersStr = ALPHABETICAL_7_LAYERS[layerNum] || q.quadLetters.map(l => l.char).join(' ');
                } else {
                    arabicLettersStr = q.quadLetters.map(l => l.char).join(' ');
                }

                return {
                    layer: layerNum,
                    cipher: `${q.letterA} ${q.letterB}`,
                    arabic: arabicLettersStr
                };
            });

            // Sort layers to match user requirement (7 down to 1 by default)
            if (layerDirection === 'desc_7_to_1') {
                layers.sort((a, b) => b.layer - a.layer);
            } else {
                layers.sort((a, b) => a.layer - b.layer);
            }

            const noorName = customNooraniOrderName.trim() || (
                quadPairingMethod === 'noorani_nr' ? 'ترتيب ن ر' :
                quadPairingMethod === 'similarity_twins' ? 'التوأمة الإحصائية' :
                quadPairingMethod === 'fawatih_cooccurrence' ? 'اقتران الفواتح' :
                'أعلى استحقاق تراكمي'
            );

            const arabName = customArabicOrderName.trim() || (
                arabicContentMode === 'alphabetical_standard' ? 'الفبائي' : 'استحقاق التلازم القرآني'
            );

            const cipherExportObj = {
                version: "2.0",
                nooraniOrderName: noorName,
                arabicOrderName: arabName,
                name: `سماء: ${noorName} × أرض: ${arabName}`,
                layers
            };

            return JSON.stringify(cipherExportObj, null, 2);
        }

        if (exportFormat === 'json') {
            const data = nooraniQuadPairs.map(q => ({
                pair_id: q.pairId,
                noorani_pair: [q.letterA, q.letterB],
                noorani_names: [q.letterAName, q.letterBName],
                relationship: q.relationship,
                best_4_letters: q.quadLetters.map(l => l.char),
                letters_detailed: q.quadLetters.map((l, idx) => ({
                    rank: idx + 1,
                    letter: l.char,
                    name: l.name,
                    score: l.score,
                    origin_noorani: l.fromNoorani
                })),
                total_quad_score: q.totalQuadScore
            }));
            return JSON.stringify(data, null, 2);
        }

        if (exportFormat === 'python') {
            const lines: string[] = [
                '# -*- coding: utf-8 -*-',
                '# خريطة الأزواج النورانية السباعية ↔ أفضل 4 أحرف لكل زوج',
                '# 7 أزواج × 4 أحرف = 28 حرفاً أبجدياً كاملاً دون أي تكرار ودون أي نقص',
                '',
                'NOORANI_7_PAIRS_QUAD_MAP = ['
            ];
            nooraniQuadPairs.forEach(q => {
                const quadChars = q.quadLetters.map(l => `"${l.char}"`).join(', ');
                lines.push('    {');
                lines.push(`        "pair_id": ${q.pairId},`);
                lines.push(`        "noorani_pair": ("${q.letterA}", "${q.letterB}"),`);
                lines.push(`        "noorani_names": ("${q.letterAName}", "${q.letterBName}"),`);
                lines.push(`        "best_4_letters": [${quadChars}],`);
                lines.push(`        "total_score": ${q.totalQuadScore},`);
                lines.push(`        "relationship": "${q.relationship}",`);
                lines.push('    },');
            });
            lines.push(']');
            return lines.join('\n');
        }

        if (exportFormat === 'typescript') {
            const lines: string[] = [
                '// خريطة الأزواج النورانية الـ 7 ↔ أفضل 4 أحرف أبجدية كاملة (28 / 28)',
                'export interface NooraniQuadItem {',
                '    pairId: number;',
                '    nooraniPair: [string, string];',
                '    nooraniPairNames: [string, string];',
                '    best4Letters: [string, string, string, string];',
                '    totalScore: number;',
                '    relationship: string;',
                '}',
                '',
                'export const NOORANI_7_PAIRS_QUAD_MAP: NooraniQuadItem[] = ['
            ];
            nooraniQuadPairs.forEach(q => {
                const quadChars = q.quadLetters.map(l => `'${l.char}'`).join(', ');
                lines.push('    {');
                lines.push(`        pairId: ${q.pairId},`);
                lines.push(`        nooraniPair: ['${q.letterA}', '${q.letterB}'],`);
                lines.push(`        nooraniPairNames: ['${q.letterAName}', '${q.letterBName}'],`);
                lines.push(`        best4Letters: [${quadChars}],`);
                lines.push(`        totalScore: ${q.totalQuadScore},`);
                lines.push(`        relationship: '${q.relationship}',`);
                lines.push('    },');
            });
            lines.push('];');
            return lines.join('\n');
        }

        if (exportFormat === 'markdown') {
            const lines: string[] = [
                '### منظومة الأزواج النورانية الـ 7 ↔ أفضل 4 أحرف مقابلة (28 حرفاً كاملاً)',
                '',
                '| # | الزوج النوراني | أفضل 4 أحرف أبجدية مقابلة (مرتبة حسب الاستحقاق) | مجموع النقاط | طبيعة الاقتران |',
                '|:---:|:---:|:---|:---:|:---|'
            ];
            nooraniQuadPairs.forEach(q => {
                const lettersStr = q.quadLetters.map((l, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅';
                    return `${medal} ${l.char} (${l.score}ن من ${l.fromNoorani})`;
                }).join(' • ');
                lines.push(`| ${q.pairId} | [${q.letterA}] + [${q.letterB}] | ${lettersStr} | ${q.totalQuadScore}ن | ${q.relationship} |`);
            });
            return lines.join('\n');
        }

        if (exportFormat === 'csv') {
            const lines: string[] = [
                'Pair_ID,Noorani_1,Noorani_2,Letter_1,Score_1,Letter_2,Score_2,Letter_3,Score_3,Letter_4,Score_4,Total_Score,Relationship'
            ];
            nooraniQuadPairs.forEach(q => {
                const l = q.quadLetters;
                lines.push(
                    `${q.pairId},"${q.letterA}","${q.letterB}",` +
                    `"${l[0]?.char || ''}",${l[0]?.score || 0},` +
                    `"${l[1]?.char || ''}",${l[1]?.score || 0},` +
                    `"${l[2]?.char || ''}",${l[2]?.score || 0},` +
                    `"${l[3]?.char || ''}",${l[3]?.score || 0},` +
                    `${q.totalQuadScore},"${q.relationship}"`
                );
            });
            return lines.join('\n');
        }

        return '';
    }, [nooraniQuadPairs, exportFormat, layerDirection, arabicContentMode, customNooraniOrderName, customArabicOrderName, quadPairingMethod]);

    const handleCopyExportCode = () => {
        if (!exportCodeText) return;
        navigator.clipboard.writeText(exportCodeText);
        setCopiedExport(true);
        setTimeout(() => setCopiedExport(false), 2000);
    };

    const handleDownloadExportFile = () => {
        if (!exportCodeText) return;
        const isArabicCipher = exportFormat === 'arabic_cipher_v2';
        const filename = isArabicCipher 
            ? `arabic_cipher_v2_${quadPairingMethod}.json`
            : `noorani_quad_${exportFormat}.${exportFormat === 'json' ? 'json' : exportFormat === 'python' ? 'py' : exportFormat === 'typescript' ? 'ts' : exportFormat === 'markdown' ? 'md' : 'csv'}`;

        const blob = new Blob([exportCodeText], { 
            type: isArabicCipher || exportFormat === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadedExport(true);
        setTimeout(() => setDownloadedExport(false), 2500);
    };

    // 10. Determine rows order according to sortMode for Full Matrix
    const displayedNodes = useMemo(() => {
        if (cipherResults.length === 0) return [];
        if (sortMode === 'similarity_pairs') {
            return similarityData.sortedNodes;
        }
        if (sortMode === 'similarity_to_active' && selectedNodeLetter) {
            const matrix = similarityData.similarityMatrix;
            return [...cipherResults].sort((a, b) => {
                if (a.nooraniLetter === selectedNodeLetter) return -1;
                if (b.nooraniLetter === selectedNodeLetter) return 1;
                const simA = matrix[selectedNodeLetter]?.[a.nooraniLetter] || 0;
                const simB = matrix[selectedNodeLetter]?.[b.nooraniLetter] || 0;
                return simB - simA;
            });
        }
        return cipherResults; // standard Quranic order
    }, [cipherResults, sortMode, similarityData, selectedNodeLetter]);

    // Active selected node for in-depth inspection
    const activeNode = useMemo(() => {
        return cipherResults.find(n => n.nooraniLetter === selectedNodeLetter) || cipherResults[0];
    }, [cipherResults, selectedNodeLetter]);

    // Top similar partners for the active node
    const activeNodePartners = useMemo(() => {
        if (!activeNode || !similarityData.similarityMatrix[activeNode.nooraniLetter]) return [];
        const letter = activeNode.nooraniLetter;
        const matrix = similarityData.similarityMatrix[letter];

        const list: { letter: string; name: string; similarity: number }[] = [];
        cipherResults.forEach(n => {
            if (n.nooraniLetter !== letter) {
                list.push({
                    letter: n.nooraniLetter,
                    name: n.nooraniLetterName,
                    similarity: matrix[n.nooraniLetter] || 0
                });
            }
        });

        list.sort((a, b) => b.similarity - a.similarity);
        return list;
    }, [activeNode, similarityData, cipherResults]);

    // Simulation calculation using the optimal 14x2 table
    const optimalTranslationResult = useMemo(() => {
        if (!testWord.trim() || alphabetToNooraniMap.size === 0) return null;
        const chars = Array.from(testWord);
        const encoded: string[] = [];
        const details: { char: string; mappedNoorani: string }[] = [];

        chars.forEach(ch => {
            if (ch === ' ') {
                encoded.push(' ');
                return;
            }
            const mapped = alphabetToNooraniMap.get(ch) || ch;
            encoded.push(mapped);
            details.push({ char: ch, mappedNoorani: mapped });
        });

        return {
            original: testWord,
            encodedToNoorani: encoded.join(''),
            details
        };
    }, [testWord, alphabetToNooraniMap]);

    // Copy 14x2 Preferential Table
    const handleCopyPreferentialTable = () => {
        if (optimalPartition.assignments.length === 0) return;
        const lines = [
            '=== الجدول التفضيلي المزدوج: 14 حرفاً نورانياً ↔ 28 حرفاً أبجدياً كاملة ===',
            `طريقة التعيين: ${matchingMethod === 'hungarian_global_optimum' ? 'التعيين التوافقي الأمثل الشامل (Hungarian Global Optimum)' : 'التعيين بالأولوية التراتبية (Greedy Priority)'}`,
            `اكتمال الأبجدية في العمود الثاني: ${optimalPartition.coverageCount} / 28 حرفاً (100% بدون أي تكرار وبدون أي نقص)`,
            'ملاحظة: اليمين = حرف نوراني | اليسار = حرفان من الأبجدية',
            '------------------------------------------------------------------',
            'الحرف النوراني (اليمين)  |  الحرف الأول (اليسار)  |  الحرف الثاني (اليسار)  |  مجموع النقاط',
            '------------------------------------------------------------------'
        ];

        optimalPartition.assignments.forEach((item, i) => {
            lines.push(
                `${i + 1}. [${item.nooraniLetter}] (${item.nooraniLetterName})  |  ` +
                `[${item.letter1.char}] (${item.letter1.name} - ${item.letter1.score}ن)  |  ` +
                `[${item.letter2.char}] (${item.letter2.name} - ${item.letter2.score}ن)  |  ` +
                `${item.totalPairScore} نقطة`
            );
        });

        lines.push('------------------------------------------------------------------');
        lines.push('توزيع الأبجدية الـ 28 بالكامل:');
        ARABIC_ALPHABET_28.forEach(a => {
            lines.push(`حرف ${a.letter} (${a.name}) ⟵ يقابله النوراني [${alphabetToNooraniMap.get(a.letter) || '؟'}]`);
        });

        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl text-text-primary min-h-[85vh] space-y-6" dir="rtl">
            {/* Top Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                <a
                    href="#/structure"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-subtle"
                >
                    <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    <span>العودة إلى بنية المصحف</span>
                </a>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>التوزيع التفضيلي: كل حرف نوراني مقابله حرفان من الأبجدية</span>
                </div>
            </div>

            {/* Header Description */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex">
                                <SparklesIcon className="w-7 h-7" />
                            </span>
                            <span>الجدول التفضيلي (14 نوراني ↔ 28 أبجدي كاملة)</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-4xl">
                            تطبيق فكرة <strong>(14 × 2 = 28)</strong>: وضع أفضل احتمال تفضيلي بحيث يستحق كل حرف نوراني <strong>حرفين من الأبجدية</strong>، وينتج جدول بسيط: <strong>على اليمين الحرف النوراني وعلى اليسار الحرفان المقابلان</strong>، مع احتواء العمود الثاني على <strong>الأبجدية العربية كاملة (28 / 28) دون تكرار ودون نقص</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyPreferentialTable}
                        disabled={isProcessing}
                        className="py-2.5 px-5 bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs self-start shrink-0"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">تم نسخ الجدول بنجاح</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4 text-text-muted" />
                                <span>نسخ الجدول التفضيلي</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Control Panel & Parameters */}
                <div className="pt-4 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Matching Algorithm */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            طريقة التعيين والتحسين:
                        </label>
                        <select
                            value={matchingMethod}
                            onChange={(e) => setMatchingMethod(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="hungarian_global_optimum">التعيين التوافقي الأمثل الشامل (Hungarian)</option>
                            <option value="greedy_priority">التعيين التراتبي بالأسبقية (Greedy Priority)</option>
                        </select>
                    </div>

                    {/* Weight Model */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            معيار الاستحقاق الرياضي:
                        </label>
                        <select
                            value={weightModel}
                            onChange={(e) => setWeightModel(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="balanced">متكامل (التصاق + تجاور + فواتح)</option>
                            <option value="attachment_heavy">تركيز الالتصاق المباشر (سوابق ولواحق)</option>
                            <option value="fawatih_heavy">تركيز الكثافة في سور الفواتح</option>
                        </select>
                    </div>

                    {/* Scope Selector */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            نطاق البيانات:
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="all_quran">كامل المصحف (114 سورة)</option>
                            <option value="fawatih_surahs_only">سور الفواتح الـ 29 فقط</option>
                        </select>
                    </div>

                    {/* Waw Bond Option */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
                            <span>ارتباط الواو مع (ن، ق، ص):</span>
                            <input
                                type="checkbox"
                                checked={includeWawBond}
                                onChange={(e) => setIncludeWawBond(e.target.checked)}
                                className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer accent-amber-600"
                            />
                        </label>
                        <p className="text-[11px] text-text-muted leading-tight">
                            مراعاة اقتران الواو بفواتح القسم (ن والقلم، ق والقرآن، ص والقرآن).
                        </p>
                    </div>
                </div>

                {/* Primary Tabs Navigation */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle">
                    <button
                        type="button"
                        onClick={() => setActiveMainTab('preferential_14x2')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'preferential_14x2'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>✨</span>
                        <span>الجدول التفضيلي البسيط (14 نوراني ↔ حرفان لكل حرف)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMainTab('full_matrix')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'full_matrix'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>📊</span>
                        <span>مصفوفة التكويد والتشابه الكاملة (فرز الأزواج التوأمة)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMainTab('playground')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'playground'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>🧪</span>
                        <span>مختبر فك وتجربة الشيفرة</span>
                    </button>
                </div>
            </div>

            {/* PROCESSING PROGRESS BAR */}
            {isProcessing && (
                <div className="bg-surface rounded-2xl border border-amber-500/30 p-8 shadow-md space-y-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-spin">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary">
                            جاري تنفيذ المعالجة الحسابية والتعيين التفضيلي...
                        </h2>
                        <p className="text-xs md:text-sm text-text-secondary font-mono">
                            {progressStepText}
                        </p>
                    </div>

                    <div className="w-full bg-surface-subtle h-3.5 rounded-full overflow-hidden border border-border-default p-0.5">
                        <div
                            className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300 shadow-inner"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {!isProcessing && cipherResults.length > 0 && (
                <div className="space-y-6">
                    {/* TAB 1: THE CORE 14x2 PREFERENTIAL TABLE (MAIN USER REQUEST) */}
                    {activeMainTab === 'preferential_14x2' && (
                        <div className="space-y-6">
                            {/* ALPHABET COMPLETION / VERIFICATION STATUS BANNER */}
                            <div className="bg-surface rounded-2xl border border-emerald-500/30 p-5 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm md:text-base font-bold text-text-primary">
                                                اكتمال تغطية الأبجدية في العمود الثاني: 28 / 28 حرفاً (100%)
                                            </h3>
                                            <p className="text-xs text-text-secondary">
                                                كل حرف من حروف الأبجدية الـ 28 تم تعيينه مرة واحدة بالضبط دون أي تكرار ودون أي نقصان (14 صفاً × حرفين = 28 حرفاً).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 self-start">
                                        مجموع نقاط الاستحقاق التراكمي: {optimalPartition.totalScore}ن
                                    </div>
                                </div>

                                {/* Visual strip of all 28 Arabic letters in order showing which Noorani letter each was matched to */}
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-text-muted block">
                                        فحص الأبجدية الـ 28 وتوزيعها على الحروف النورانية:
                                    </span>
                                    <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-1 text-center">
                                        {ARABIC_ALPHABET_28.map(a => {
                                            const assignedNoorani = alphabetToNooraniMap.get(a.letter);
                                            return (
                                                <div 
                                                    key={a.letter}
                                                    title={`حرف الأبجدية [${a.letter}] ⟵ تم تعيينه تفضيلياً للحرف النوراني [${assignedNoorani}]`}
                                                    className="p-1 bg-surface-subtle border border-border-default rounded-lg hover:border-amber-500 transition-colors"
                                                >
                                                    <span className="font-amiri text-base font-bold text-text-primary block leading-none">
                                                        {a.letter}
                                                    </span>
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5 font-amiri">
                                                        {assignedNoorani ? `←${assignedNoorani}` : '؟'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* THE SIMPLE PREFERENTIAL TABLE & 7-PAIR QUAD SYSTEM */}
                            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                                {/* Header & View Mode Switcher */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold text-text-primary">
                                                {preferentialViewMode === 'standard_14_rows' 
                                                    ? 'الجدول التفضيلي البسيط (الحرف النوراني ↔ حرفان من الأبجدية)' 
                                                    : 'منظومة الأزواج الثنائية (7 أزواج: حرفان نورانيان ↔ أفضل 4 أحرف أبجدية)'}
                                            </h2>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold font-mono">
                                                {preferentialViewMode === 'standard_14_rows' ? '14 صفاً × حرفين' : '7 أزواج × 4 أحرف'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                                                28 / 28 حرفاً كاملاً
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {preferentialViewMode === 'standard_14_rows'
                                                ? 'ترتيب تفضيلي دقيق للحروف النورانية الـ 14 بصيغ إحصائية وقرآنية متعددة للوصول إلى الترتيب المنطقي الأمثل.'
                                                : 'صيغة التوأمة المزدوجة المخصصة للبرامج الخارجية: كل حرفين نورانيين بجانب بعضهما ومقابلهما أفضل 4 حروف أبجدية.'}
                                        </p>
                                    </div>

                                    {/* Action Buttons: View Toggle & Export Modal Trigger */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center p-1 bg-surface-subtle border border-border-default rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setPreferentialViewMode('standard_14_rows')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    preferentialViewMode === 'standard_14_rows'
                                                        ? 'bg-amber-500 text-black shadow-xs'
                                                        : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                الجدول القياسي (14 صفاً)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPreferentialViewMode('quad_7_pairs')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    preferentialViewMode === 'quad_7_pairs'
                                                        ? 'bg-amber-500 text-black shadow-xs'
                                                        : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                <span>الأزواج الـ 7 (حرفان ↔ 4 حروف)</span>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExportFormat('arabic_cipher_v2');
                                                setShowExportModal(true);
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:border-amber-500 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:bg-amber-500/25"
                                            title="تصدير النتائج بتنسيق ملف برنامج التشفير العربي (JSON v2.0)"
                                        >
                                            <DownloadIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            <span>تصدير لبرنامج التشفير العربي (.json v2.0)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* VIEW 1: STANDARD 14 ROWS WITH PREFERENTIAL SORTING MODES */}
                                {preferentialViewMode === 'standard_14_rows' && (
                                    <div className="space-y-4">
                                        {/* PREFERENTIAL SORTING BAR (صيغ الترتيب التفضيلي المتعددة) */}
                                        <div className="p-4 bg-surface-subtle border border-border-default rounded-xl space-y-2.5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-text-primary">
                                                        اختر صيغة الترتيب التفضيلي للحروف النورانية:
                                                    </span>
                                                    <span className="text-[11px] text-text-muted">
                                                        (اضغط على أي صيغة لفرز الجدول فوراً)
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                                                    الصيغة النشطة: {
                                                        preferentialSortMode === 'total_score_desc' ? 'أعلى مجموع نقاط استحقاق' :
                                                        preferentialSortMode === 'primary_score_desc' ? 'أعلى استحقاق للمقابل الأول' :
                                                        preferentialSortMode === 'distinctiveness_desc' ? 'أعلى قوة تمايز وانتقائية' :
                                                        preferentialSortMode === 'fawatih_freq_desc' ? 'الأكثر تكراراً في الفواتح' :
                                                        preferentialSortMode === 'quran_total_freq_desc' ? 'الأكثر شيوعاً في كامل المصحف' :
                                                        preferentialSortMode === 'mushaf_order' ? 'أسبقية أول ظهور في المصحف' :
                                                        preferentialSortMode === 'alphabetical' ? 'الترتيب الهجائي القياسي' :
                                                        preferentialSortMode === 'similarity_twins' ? 'أزواج التوأمة الإحصائية' :
                                                        'أقل مجموع نقاط استحقاق'
                                                    }
                                                </span>
                                            </div>

                                            {/* Formula Buttons Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
                                                {[
                                                    { id: 'total_score_desc', label: 'مجموع النقاط', icon: '🏆', desc: 'أعلى مجموع نقاط استحقاق للحرفين المقابلين' },
                                                    { id: 'primary_score_desc', label: 'المقابل الأول', icon: '🎯', desc: 'أعلى استحقاق للحرف المقابل الأول (🥇)' },
                                                    { id: 'distinctiveness_desc', label: 'قوة التمايز', icon: '⚖️', desc: 'أكبر فارق نقاط بين الأول والثاني (🥇 - 🥈)' },
                                                    { id: 'fawatih_freq_desc', label: 'تكرار الفواتح', icon: '📖', desc: 'الأكثر تكراراً في فواتح السور (17 ⟶ 1)' },
                                                    { id: 'quran_total_freq_desc', label: 'شيوع المصحف', icon: '📊', desc: 'الأكثر شيوعاً في نص المصحف الشريف كاملاً' },
                                                    { id: 'mushaf_order', label: 'الترتيب المصحفي', icon: '📜', desc: 'أسبقية أول ظهور في فواتح السور (البقرة ⟶ القلم)' },
                                                    { id: 'alphabetical', label: 'الترتيب الهجائي', icon: '🔤', desc: 'الترتيب الأبجدي الهجائي المعتاد (أ ⟶ ي)' },
                                                    { id: 'similarity_twins', label: 'أزواج التوأمة', icon: '🔗', desc: 'وضع كل حرفين نورانيين الأكثر تشابهاً متتاليين' },
                                                ].map(btn => (
                                                    <button
                                                        key={btn.id}
                                                        type="button"
                                                        onClick={() => setPreferentialSortMode(btn.id as PreferentialSortMode)}
                                                        title={btn.desc}
                                                        className={`p-2 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
                                                            preferentialSortMode === btn.id
                                                                ? 'bg-amber-500 text-black border-amber-600 shadow-xs ring-1 ring-amber-400'
                                                                : 'bg-surface border-border-default text-text-secondary hover:text-text-primary hover:border-amber-500/50'
                                                        }`}
                                                    >
                                                        <span className="text-sm leading-none">{btn.icon}</span>
                                                        <span className="leading-tight text-[11px] whitespace-nowrap">{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Formula Explanation Banner */}
                                            <div className="text-[11px] text-text-muted bg-surface/60 p-2.5 rounded-lg border border-border-subtle flex items-start gap-2">
                                                <span className="text-amber-500 font-bold shrink-0">💡 المفهوم الإحصائي:</span>
                                                <span>
                                                    {preferentialSortMode === 'total_score_desc' && 'يرتب الحروف النورانية تنازلياً حسب مجموع نقاط الاستحقاق للحرفين المقابلين؛ لإبراز الحروف ذات أقوى ارتباط تلازمي شامل في المصحف.'}
                                                    {preferentialSortMode === 'primary_score_desc' && 'يرتب الحروف النورانية وفق استحقاق المقابل الأول (🥇)؛ لإظهار الحروف التي تمتلك مرساة أساسية شديدة الهيمنة.'}
                                                    {preferentialSortMode === 'distinctiveness_desc' && 'يرتب الحروف النورانية وفق فارق النقاط بين الحرف الأول والثاني (🥇 - 🥈)؛ لكشف الحروف ذات الخيار الحاسم مقارنة بالحروف متقاربة التفضيل.'}
                                                    {preferentialSortMode === 'fawatih_freq_desc' && 'يرتب الحروف النورانية حسب عدد سور الفواتح التي وردت فيها (الميم 17، اللام 13، الألف 13، الحاء 7، الراء 6...).'}
                                                    {preferentialSortMode === 'quran_total_freq_desc' && 'يرتب الحروف النورانية حسب إجمالي عدد مرات ورود الحرف في كامل آيات وكلمات القرآن الكريم.'}
                                                    {preferentialSortMode === 'mushaf_order' && 'يرتب الحروف حسب أول سورة افتتحت بها: (البقرة: أ، ل، م ⟶ الأعراف: ص ⟶ يونس: ر ⟶ مريم: ك، هـ، ي، ع ⟶ طه: ط ⟶ الشعراء: س ⟶ غافر: ح ⟶ ق: ق ⟶ القلم: ن).'}
                                                    {preferentialSortMode === 'alphabetical' && 'يرتب الحروف النورانية وفق الترتيب الهجائي العربي التقليدي (أ، ح، ر، س، ص، ط، ع، ق، ك، ل، م، ن، هـ، ي).'}
                                                    {preferentialSortMode === 'similarity_twins' && 'يرتب الحروف بحيث يوضع كل حرفين نورانيين هما الأكثر تشابهاً وتطابقاً في مصفوفة الارتباط معاً متتاليين (للتكامل مع برنامجك الخارجي).'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* THE 14-ROW TABLE */}
                                        <div className="overflow-x-auto rounded-xl border border-border-default">
                                            <table className="w-full text-right border-collapse text-sm">
                                                <thead>
                                                    <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                                        <th className="p-3 font-bold text-center w-12">#</th>
                                                        <th 
                                                            onClick={() => setPreferentialSortMode(m => m === 'alphabetical' ? 'mushaf_order' : 'alphabetical')}
                                                            className="p-3 font-bold text-right w-1/3 cursor-pointer hover:text-amber-600 transition-colors"
                                                            title="اضغط للتبديل بين الترتيب الهجائي والترتيب المصحفي"
                                                        >
                                                            الحرف النوراني (العمود الأيمن) ⇕
                                                        </th>
                                                        <th 
                                                            onClick={() => setPreferentialSortMode('primary_score_desc')}
                                                            className="p-3 font-bold text-center w-1/3 border-r border-border-subtle cursor-pointer hover:text-amber-600 transition-colors"
                                                            title="اضغط لفرز الجدول حسب استحقاق الحرف الأول"
                                                        >
                                                            الحرف الأول المقابل (🥇) ⇕
                                                        </th>
                                                        <th className="p-3 font-bold text-center w-1/3 border-r border-border-subtle">
                                                            الحرف الثاني المقابل (🥈)
                                                        </th>
                                                        <th 
                                                            onClick={() => setPreferentialSortMode(m => m === 'total_score_desc' ? 'total_score_asc' : 'total_score_desc')}
                                                            className="p-3 font-bold text-center w-28 cursor-pointer hover:text-amber-600 transition-colors"
                                                            title="اضغط لعكس ترتيب مجموع النقاط"
                                                        >
                                                            مجموع النقاط ⇕
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle font-medium">
                                                    {sortedAssignments.map((item, idx) => {
                                                        // Render twin divider if in similarity_twins mode
                                                        const isTwinPairStart = preferentialSortMode === 'similarity_twins' && idx % 2 === 0;
                                                        const twinPartner = similarityData.bestPartnerMap[item.nooraniLetter]?.partnerLetter;
                                                        const twinSim = similarityData.bestPartnerMap[item.nooraniLetter]?.similarity;

                                                        return (
                                                            <React.Fragment key={item.nooraniLetter}>
                                                                {isTwinPairStart && (
                                                                    <tr className="bg-amber-500/10 border-y border-amber-500/25">
                                                                        <td colSpan={5} className="py-1 px-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                            <span className="font-mono">🔗 الزوج التوأم #{Math.floor(idx / 2) + 1}:</span> حرفا [{item.nooraniLetter}] و [{twinPartner || '؟'}] (نسبة التشابه: {twinSim}%)
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                <tr className="hover:bg-surface-subtle/80 transition-colors">
                                                                    {/* Row Index */}
                                                                    <td className="p-3 text-center text-xs text-text-muted font-mono">
                                                                        {idx + 1}
                                                                    </td>

                                                                    {/* RIGHT COLUMN: NOORANI LETTER WITH ACTIVE METRIC BADGE */}
                                                                    <td className="p-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-amiri text-2xl font-bold text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                                                                                {item.nooraniLetter}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                                                                                    <span>حرف {item.nooraniLetterName}</span>
                                                                                    {/* Metric Indicator Chip according to current sort */}
                                                                                    {preferentialSortMode === 'distinctiveness_desc' && (
                                                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                                                                                            فارق: +{Math.round((item.letter1.score - item.letter2.score) * 10) / 10}ن
                                                                                        </span>
                                                                                    )}
                                                                                    {preferentialSortMode === 'fawatih_freq_desc' && (
                                                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                                                                            {item.fawatihSurahsCount} سور
                                                                                        </span>
                                                                                    )}
                                                                                    {preferentialSortMode === 'quran_total_freq_desc' && (
                                                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                                                                            {(cipherResults.find(n => n.nooraniLetter === item.nooraniLetter)?.totalOccurrences || 0).toLocaleString('ar-SA')} موضع
                                                                                        </span>
                                                                                    )}
                                                                                    {preferentialSortMode === 'mushaf_order' && (
                                                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                                                                            رتبة #{NOORANI_MUSHAF_ORDER[item.nooraniLetter] || idx + 1}
                                                                                        </span>
                                                                                    )}
                                                                                    {preferentialSortMode === 'alphabetical' && (
                                                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border-default text-text-secondary">
                                                                                            هجائياً #{NOORANI_ALPHABETICAL_ORDER[item.nooraniLetter] || idx + 1}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-[11px] text-text-muted mt-0.5">
                                                                                    {item.fawatihSurahsCount} سور فواتح • {(cipherResults.find(n => n.nooraniLetter === item.nooraniLetter)?.totalOccurrences || 0).toLocaleString('ar-SA')} تكرار بالمصحف
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* LEFT COLUMN PART 1: FIRST ASSIGNED ALPHABET LETTER */}
                                                                    <td className="p-3 border-r border-border-subtle">
                                                                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-default hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <span className="font-amiri text-3xl font-black text-primary leading-none">
                                                                                    {item.letter1.char}
                                                                                </span>
                                                                                <div>
                                                                                    <div className="text-xs font-bold text-text-primary">
                                                                                        حرف {item.letter1.name}
                                                                                    </div>
                                                                                    <div className="text-[10px] text-text-muted">
                                                                                        الرتبة في المقترحات: #{item.letter1.originalRank}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-left font-mono">
                                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                                                                    {item.letter1.score}ن
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* LEFT COLUMN PART 2: SECOND ASSIGNED ALPHABET LETTER */}
                                                                    <td className="p-3 border-r border-border-subtle">
                                                                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-default hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <span className="font-amiri text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
                                                                                    {item.letter2.char}
                                                                                </span>
                                                                                <div>
                                                                                    <div className="text-xs font-bold text-text-primary">
                                                                                        حرف {item.letter2.name}
                                                                                    </div>
                                                                                    <div className="text-[10px] text-text-muted">
                                                                                        الرتبة في المقترحات: #{item.letter2.originalRank}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-left font-mono">
                                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                                    {item.letter2.score}ن
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* Total Pair Score */}
                                                                    <td className="p-3 text-center">
                                                                        <span className="text-xs font-bold font-mono text-text-primary block">
                                                                            {item.totalPairScore}ن
                                                                        </span>
                                                                        <span className="text-[10px] text-text-muted font-mono block">
                                                                            فارق: {Math.round((item.letter1.score - item.letter2.score) * 10) / 10}ن
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW 2: 7-PAIRS QUAD SYSTEM (حرفان نورانيان ↔ أفضل 4 حروف أبجدية) */}
                                {preferentialViewMode === 'quad_7_pairs' && (
                                    <div className="space-y-5">
                                        {/* Pairing Strategy Controls */}
                                        <div className="p-4 bg-surface-subtle border border-border-default rounded-xl space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                                                <div>
                                                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                                        <span>طريقة تكوين الأزواج النورانية الـ 7:</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                                                            7 أزواج × 4 حروف = 28 حرفاً كاملاً
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        اختر كيف ترغب في تجميع كل حرفين نورانيين معاً، وسيقوم المحرك تلقائياً بجلب أفضل 4 حروف أبجدية مستحقة لهما بالكامل.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setExportFormat('arabic_cipher_v2');
                                                            setShowExportModal(true);
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-xs flex items-center gap-1.5"
                                                    >
                                                        <DownloadIcon className="w-3.5 h-3.5" />
                                                        <span>تصدير لبرنامج التشفير العربي (v2.0)</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Strategy Buttons: 4 Choices */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuadPairingMethod('noorani_nr')}
                                                    className={`p-3 rounded-xl border text-right transition-all relative ${
                                                        quadPairingMethod === 'noorani_nr'
                                                            ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-text-primary'
                                                            : 'bg-surface border-border-default text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                            1. ترتيب ن ر (التشفير العربي)
                                                        </span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[10px]">ملفك ⭐</span>
                                                    </div>
                                                    <p className="text-[11px] text-text-muted leading-relaxed">
                                                        الأزواج السبعة لطبقات السماء في برنامجك: (ن-ق، ص-ح، م-ي، س-ط، ه-ا، ل-ر، ع-ك).
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setQuadPairingMethod('similarity_twins')}
                                                    className={`p-3 rounded-xl border text-right transition-all ${
                                                        quadPairingMethod === 'similarity_twins'
                                                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30 text-text-primary'
                                                            : 'bg-surface border-border-default text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                            2. أزواج التوأمة الإحصائية
                                                        </span>
                                                        <span className="text-sm">🧬</span>
                                                    </div>
                                                    <p className="text-[11px] text-text-muted leading-relaxed">
                                                        أعلى تشابه رياضي في متجهات التلاصق والاقتران (ط-س، ح-م، ك-ي، ع-ص، أ-ل...).
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setQuadPairingMethod('fawatih_cooccurrence')}
                                                    className={`p-3 rounded-xl border text-right transition-all ${
                                                        quadPairingMethod === 'fawatih_cooccurrence'
                                                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30 text-text-primary'
                                                            : 'bg-surface border-border-default text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                            3. أزواج الفواتح المقترنة
                                                        </span>
                                                        <span className="text-sm">📖</span>
                                                    </div>
                                                    <p className="text-[11px] text-text-muted leading-relaxed">
                                                        الأزواج التي جاءت متلاصقة في فواتح السور (أ-ل في 13 سورة، ط-س في الطواسين، ح-م...).
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setQuadPairingMethod('score_desc')}
                                                    className={`p-3 rounded-xl border text-right transition-all ${
                                                        quadPairingMethod === 'score_desc'
                                                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30 text-text-primary'
                                                            : 'bg-surface border-border-default text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                            4. أزواج القوة الرباعية
                                                        </span>
                                                        <span className="text-sm">🏆</span>
                                                    </div>
                                                    <p className="text-[11px] text-text-muted leading-relaxed">
                                                        مرتبة تنازلياً حسب أعلى مجموع تراكمي لنقاط الأحرف الأربعة مجتمعة.
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* THE 7-ROW QUAD TABLE */}
                                        <div className="overflow-x-auto rounded-xl border border-border-default">
                                            <table className="w-full text-right border-collapse text-sm">
                                                <thead>
                                                    <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                                        <th className="p-3 font-bold text-center w-12">#</th>
                                                        <th className="p-3 font-bold text-right w-1/4">
                                                            الزوج النوراني (حرفان بجانب بعضهما)
                                                        </th>
                                                        <th className="p-3 font-bold text-center w-1/2 border-r border-border-subtle">
                                                            أفضل 4 حروف أبجدية مقابلة (مرتبة حسب الاستحقاق 🥇 🥈 🥉 🏅)
                                                        </th>
                                                        <th className="p-3 font-bold text-center w-28 border-r border-border-subtle">
                                                            المجموع الرباعي
                                                        </th>
                                                        <th className="p-3 font-bold text-center w-20">إجراء</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle font-medium">
                                                    {nooraniQuadPairs.map(quad => {
                                                        const quadLettersSummary = quad.quadLetters.map(l => l.char).join(' ');
                                                        return (
                                                            <tr key={`${quad.pairId}-${quad.letterA}-${quad.letterB}`} className="hover:bg-surface-subtle/80 transition-colors">
                                                                {/* Index */}
                                                                <td className="p-3 text-center text-xs text-text-muted font-mono">
                                                                    الزوج {quad.pairId}
                                                                </td>

                                                                {/* Noorani Pair (Two letters side-by-side) */}
                                                                <td className="p-3">
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Letter A */}
                                                                            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-amiri text-2xl font-bold text-amber-600 dark:text-amber-400 shadow-2xs">
                                                                                {quad.letterA}
                                                                            </div>
                                                                            <span className="text-text-muted font-bold text-sm">+</span>
                                                                            {/* Letter B */}
                                                                            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-amiri text-2xl font-bold text-primary shadow-2xs">
                                                                                {quad.letterB}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-sm text-text-primary">
                                                                                    {quad.letterAName} و {quad.letterBName}
                                                                                </div>
                                                                                <div className="text-[10px] text-text-muted">
                                                                                    {quad.relationship}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* The 4 Best Alphabet Letters */}
                                                                <td className="p-3 border-r border-border-subtle">
                                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                                        {quad.quadLetters.map((l, lIdx) => {
                                                                            const medals = ['🥇', '🥈', '🥉', '🏅'];
                                                                            const isFromA = l.fromNoorani === quad.letterA;
                                                                            return (
                                                                                <div 
                                                                                    key={`${quad.pairId}-${l.char}-${lIdx}`}
                                                                                    className={`p-2 rounded-xl border transition-all ${
                                                                                        isFromA 
                                                                                            ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500' 
                                                                                            : 'bg-primary/5 border-primary/25 hover:border-primary'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                        <span className="text-xs" title={`المرتبة ${lIdx + 1}`}>
                                                                                            {medals[lIdx]}
                                                                                        </span>
                                                                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                                                                            isFromA ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-primary/15 text-primary'
                                                                                        }`}>
                                                                                            {l.score}ن
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`font-amiri text-2xl font-black leading-none ${
                                                                                            isFromA ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                                                                                        }`}>
                                                                                            {l.char}
                                                                                        </span>
                                                                                        <div>
                                                                                            <span className="text-xs font-bold text-text-primary block leading-none">
                                                                                                حرف {l.name}
                                                                                            </span>
                                                                                            <span className="text-[9px] text-text-muted block mt-0.5">
                                                                                                مستحق لـ [{l.fromNoorani}]
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </td>

                                                                {/* Combined Quad Score */}
                                                                <td className="p-3 text-center border-r border-border-subtle">
                                                                    <div className="space-y-0.5">
                                                                        <span className="text-sm font-bold font-mono text-text-primary block">
                                                                            {quad.totalQuadScore}ن
                                                                        </span>
                                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                                                            4 أحرف مميزة
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* Quick Copy Row Button */}
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const text = `الزوج النوراني: [${quad.letterA} + ${quad.letterB}] ⟵ الأحرف الأربعة: ${quadLettersSummary} (مجموع النقاط: ${quad.totalQuadScore}ن)`;
                                                                            navigator.clipboard.writeText(text);
                                                                            setCopied(true);
                                                                            setTimeout(() => setCopied(false), 2000);
                                                                        }}
                                                                        title="نسخ بيانات هذا الزوج للحافظة"
                                                                        className="p-2 rounded-lg bg-surface-subtle border border-border-default hover:border-amber-500 text-text-secondary hover:text-text-primary transition-colors text-xs inline-flex items-center justify-center"
                                                                    >
                                                                        <CopyIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CODE & DATA EXPORT MODAL (FOR USER'S OTHER PROGRAM: التشفير العربي) */}
                            {showExportModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
                                    <div className="bg-surface rounded-2xl border border-border-default shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {/* Modal Header */}
                                        <div className="p-4 md:p-5 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                                                    <DownloadIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-bold text-text-primary">
                                                            تصدير البيانات لبرنامج «التشفير العربي»
                                                        </h3>
                                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                                                            JSON Schema v2.0
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        تصدير مطابق تماماً لتنسيق ملف برنامجك (7 طبقات: سماء نورانية ↔ أرض أبجدية 28 حرفاً).
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowExportModal(false)}
                                                className="w-8 h-8 rounded-lg bg-surface-subtle hover:bg-surface-subtle/80 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                <ClearIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Format Tabs & Preview Selector */}
                                        <div className="px-5 pt-2.5 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2 bg-surface-subtle/50">
                                            <div className="flex items-center gap-1 overflow-x-auto">
                                                {[
                                                    { id: 'arabic_cipher_v2', label: 'التشفير العربي (v2.0)', badge: 'ملفك ⭐' },
                                                    { id: 'json', label: 'JSON عام', ext: '.json' },
                                                    { id: 'python', label: 'Python (Dict)', ext: '.py' },
                                                    { id: 'typescript', label: 'TypeScript', ext: '.ts' },
                                                    { id: 'markdown', label: 'Markdown Table', ext: '.md' },
                                                    { id: 'csv', label: 'CSV Spreadsheet', ext: '.csv' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setExportFormat(tab.id as ExportCodeFormat)}
                                                        className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                                                            exportFormat === tab.id
                                                                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-surface shadow-xs'
                                                                : 'border-transparent text-text-secondary hover:text-text-primary'
                                                        }`}
                                                    >
                                                        <span>{tab.label}</span>
                                                        {tab.badge && (
                                                            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500 text-black font-extrabold">
                                                                {tab.badge}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {exportFormat === 'arabic_cipher_v2' && (
                                                <div className="flex items-center p-0.5 bg-surface border border-border-default rounded-lg mb-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalSubTab('code')}
                                                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                                            modalSubTab === 'code' ? 'bg-amber-500 text-black shadow-xs' : 'text-text-secondary'
                                                        }`}
                                                    >
                                                        كود JSON
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalSubTab('visual_preview')}
                                                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                                            modalSubTab === 'visual_preview' ? 'bg-amber-500 text-black shadow-xs' : 'text-text-secondary'
                                                        }`}
                                                    >
                                                        معاينة الطبقات (سماء وأرض)
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Configuration Bar for Arabic Cipher v2 */}
                                        {exportFormat === 'arabic_cipher_v2' && (
                                            <div className="p-3.5 bg-surface border-b border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                {/* Sky Pairing Strategy */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                                        أزواج السماء (النورانية):
                                                    </label>
                                                    <select
                                                        value={quadPairingMethod}
                                                        onChange={(e) => setQuadPairingMethod(e.target.value as QuadPairingMethod)}
                                                        className="w-full bg-surface-subtle border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-hidden focus:border-amber-500"
                                                    >
                                                        <option value="noorani_nr">ترتيب ن ر (ن-ق، ص-ح، م-ي، س-ط... كبرنامجك)</option>
                                                        <option value="similarity_twins">التوأمة الإحصائية (أعلى تشابه قرآني)</option>
                                                        <option value="fawatih_cooccurrence">اقتران الفواتح (الم، طسم، حم...)</option>
                                                        <option value="score_desc">أعلى قوة استحقاق رباعي</option>
                                                    </select>
                                                </div>

                                                {/* Earth Letters Mode */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                                        حروف الأرض (28 حرفاً أبجدياً):
                                                    </label>
                                                    <select
                                                        value={arabicContentMode}
                                                        onChange={(e) => setArabicContentMode(e.target.value as ArabicLetterContentMode)}
                                                        className="w-full bg-surface-subtle border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-hidden focus:border-amber-500"
                                                    >
                                                        <option value="quranic_optimal">استحقاق التلازم القرآني (4 أحرف مستحقة لكل زوج)</option>
                                                        <option value="alphabetical_standard">الترتيب الألفبائي الهجائي القياسي (أ ب ت ث... كملفك)</option>
                                                    </select>
                                                </div>

                                                {/* Layer Direction */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                                        تسلسل الطبقات:
                                                    </label>
                                                    <select
                                                        value={layerDirection}
                                                        onChange={(e) => setLayerDirection(e.target.value as LayerDirectionMode)}
                                                        className="w-full bg-surface-subtle border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-hidden focus:border-amber-500"
                                                    >
                                                        <option value="desc_7_to_1">من الطبقة 7 إلى 1 (تنازلي - كالملف المرفق)</option>
                                                        <option value="asc_1_to_7">من الطبقة 1 إلى 7 (تصاعدي)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Modal Main Content Area */}
                                        <div className="p-4 md:p-5 flex-1 overflow-y-auto">
                                            {exportFormat === 'arabic_cipher_v2' && modalSubTab === 'visual_preview' ? (
                                                /* Visual 7-Layers Preview matching "Arabic Cipher" software UI */
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default text-xs flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-text-primary">اسم المنظومة:</span>
                                                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                                                سماء: {quadPairingMethod === 'noorani_nr' ? 'ترتيب ن ر' : 'توأمة إحصائية'} × أرض: {arabicContentMode === 'alphabetical_standard' ? 'الفبائي' : 'استحقاق قرآني'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-text-muted">
                                                            7 طبقات سماء × أرض (28 حرفاً كاملاً)
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {(() => {
                                                            const layerColorConfig: Record<number, { border: string; bg: string; text: string; badge: string }> = {
                                                                7: { border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500 text-white' },
                                                                6: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500 text-white' },
                                                                5: { border: 'border-teal-500/40', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-500 text-white' },
                                                                4: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500 text-white' },
                                                                3: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500 text-black' },
                                                                2: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500 text-white' },
                                                                1: { border: 'border-rose-500/40', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500 text-white' }
                                                            };

                                                            const items = nooraniQuadPairs.map((q, idx) => {
                                                                const layerNum = layerDirection === 'desc_7_to_1' ? (7 - idx) : (idx + 1);
                                                                const earthLetters = arabicContentMode === 'alphabetical_standard' 
                                                                    ? ALPHABETICAL_7_LAYERS[layerNum] 
                                                                    : q.quadLetters.map(l => l.char).join(' ');
                                                                return { layerNum, q, earthLetters };
                                                            });

                                                            if (layerDirection === 'desc_7_to_1') {
                                                                items.sort((a, b) => b.layerNum - a.layerNum);
                                                            } else {
                                                                items.sort((a, b) => a.layerNum - b.layerNum);
                                                            }

                                                            return items.map(({ layerNum, q, earthLetters }) => {
                                                                const color = layerColorConfig[layerNum] || layerColorConfig[7];
                                                                return (
                                                                    <div 
                                                                        key={layerNum}
                                                                        className={`p-3.5 rounded-xl border ${color.border} ${color.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all`}
                                                                    >
                                                                        {/* Layer Number & Sky Letters */}
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${color.badge}`}>
                                                                                {layerNum}
                                                                            </span>
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold text-text-primary">
                                                                                        الطبقة {layerNum} (سماء {layerNum}):
                                                                                    </span>
                                                                                    <span className="font-amiri text-2xl font-bold px-3 py-0.5 rounded-lg bg-surface border border-border-default tracking-widest text-text-primary">
                                                                                        {q.letterA} {q.letterB}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[10px] text-text-muted">
                                                                                    {q.letterAName} + {q.letterBName}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Earth Letters (أرض) */}
                                                                        <div className="flex items-center gap-2 sm:justify-end">
                                                                            <span className="text-xs font-bold text-text-secondary">
                                                                                أرض {layerNum}:
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                {earthLetters.split(' ').map((char, cIdx) => (
                                                                                    <span 
                                                                                        key={cIdx}
                                                                                        className="w-8 h-8 rounded-lg bg-surface border border-border-default flex items-center justify-center font-amiri text-lg font-bold text-text-primary shadow-2xs"
                                                                                    >
                                                                                        {char}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Code Output Area */
                                                <div className="relative">
                                                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 text-left" dir="ltr">
                                                        <code>{exportCodeText}</code>
                                                    </pre>
                                                </div>
                                            )}
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="p-4 border-t border-border-subtle bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <span className="text-xs text-text-muted">
                                                {nooraniQuadPairs.length} أزواج نورانية • 28 حرفاً أبجدياً كاملاً دون تكرار
                                            </span>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowExportModal(false)}
                                                    className="px-3.5 py-2 rounded-xl bg-surface border border-border-default hover:bg-surface-subtle text-text-secondary text-xs font-bold transition-colors"
                                                >
                                                    إغلاق
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleDownloadExportFile}
                                                    className="px-4 py-2 rounded-xl bg-surface border border-amber-500/40 hover:border-amber-500 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                                                    title="تحميل الملف على جهازك مباشرة لاستيراده في برنامج التشفير العربي"
                                                >
                                                    {downloadedExport ? (
                                                        <>
                                                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                                                            <span>تم تحميل الملف!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DownloadIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                            <span>تحميل ملف JSON</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleCopyExportCode}
                                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    {copiedExport ? (
                                                        <>
                                                            <CheckIcon className="w-4 h-4 text-black" />
                                                            <span>تم النسخ بنجاح!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CopyIcon className="w-4 h-4" />
                                                            <span>نسخ الكود بالكامل</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: COMPLETE MATRIX WITH SIMILARITY PAIRS (UNDER EACH OTHER) */}
                    {activeMainTab === 'full_matrix' && (
                        <div className="space-y-6">
                            {/* QUICK SELECTION BAR OF THE 14 NOORANI LETTERS */}
                            <div className="bg-surface rounded-2xl border border-border-default p-4 md:p-5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                                    <span>اختر حرفاً نورانياً لمعاينة مراتب استحقاقه والحروف التوأمة له:</span>
                                    <span className="font-mono text-amber-600 dark:text-amber-400">14 حرفاً نورانياً</span>
                                </div>
                                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                                    {CANONICAL_14_NOORANI_LETTERS.map(({ letter, name }) => {
                                        const isSelected = selectedNodeLetter === letter;
                                        const partnerInfo = similarityData.bestPartnerMap[letter];

                                        return (
                                            <button
                                                key={letter}
                                                type="button"
                                                onClick={() => setSelectedNodeLetter(letter)}
                                                title={`حرف ${name} | الأقرب شبهاً: ${partnerInfo?.partnerLetter || '-'} (${partnerInfo?.similarity || 0}%)`}
                                                className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-primary text-white border-primary shadow-md scale-105'
                                                        : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-primary/50'
                                                }`}
                                            >
                                                <span className="font-amiri text-2xl font-bold leading-none">{letter}</span>
                                                <span className="text-[10px] mt-1 opacity-80 truncate max-w-[45px]">{name}</span>
                                                {partnerInfo && (
                                                    <span className={`text-[9px] font-mono mt-0.5 px-1 rounded ${
                                                        isSelected ? 'bg-white/20 text-white' : 'text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        ≈{partnerInfo.partnerLetter}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* FOCUS CARD: THE SELECTED NOORANI LETTER */}
                            {activeNode && (
                                <div className="bg-surface rounded-2xl border-2 border-amber-500/30 p-6 md:p-8 shadow-sm space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-amiri text-5xl font-bold shadow-inner">
                                                {activeNode.nooraniLetter}
                                            </div>
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
                                                    <span>الأحرف الأكثر استحقاقاً لحرف «{activeNode.nooraniLetter}» ({activeNode.nooraniLetterName})</span>
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
                                                    <span>وروده في القرآن: <strong className="text-text-primary font-mono">{activeNode.totalOccurrences.toLocaleString('ar-SA')}</strong> موضع</span>
                                                    <span>•</span>
                                                    <span>سور الفواتح ({activeNode.fawatihSurahs.length}): {activeNode.fawatihSurahs.map(s => s.name).join('، ')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Twin Partners Highlight */}
                                        {activeNodePartners.length > 0 && (
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                                    <span>🔗 الأكثر تشابهاً مع «{activeNode.nooraniLetter}»:</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {activeNodePartners.slice(0, 3).map((partner) => (
                                                        <button
                                                            key={partner.letter}
                                                            type="button"
                                                            onClick={() => setSelectedNodeLetter(partner.letter)}
                                                            className="px-2 py-0.5 rounded-lg bg-surface border border-amber-500/30 hover:border-primary text-text-primary font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                                                        >
                                                            <span className="font-amiri text-sm">{partner.letter}</span>
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                                                                ({partner.similarity}%)
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Focus Candidates View Scope Switcher */}
                                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                        <span className="font-bold text-text-muted">عرض الأحرف المقابلة بالرتب:</span>
                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(4)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 4 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                أعلى 4 أحرف (المقترح)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(10)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 10 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                أعلى 10 أحرف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(28)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 28 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                جميع الحروف الـ 28
                                            </button>
                                        </div>
                                    </div>

                                    {/* THE CANDIDATE LETTERS GRID */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {activeNode.allCandidates.slice(0, focusCandidatesLimit).map((cand, idx) => {
                                            const rank = idx + 1;
                                            const isTop4 = rank <= 4;
                                            const medal = rank === 1 ? '🥇 الأول' : rank === 2 ? '🥈 الثاني' : rank === 3 ? '🥉 الثالث' : rank === 4 ? '🏅 الرابع' : `رتبة #${rank}`;

                                            return (
                                                <div
                                                    key={cand.letter}
                                                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs ${
                                                        isTop4
                                                            ? 'bg-surface-subtle border-amber-500/30 hover:border-primary/50'
                                                            : 'bg-surface border-border-default hover:border-primary/40'
                                                    }`}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-xs font-bold ${isTop4 ? 'text-amber-700 dark:text-amber-300' : 'text-text-muted'}`}>
                                                                {medal}
                                                            </span>
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                                                                {cand.score} نقطة
                                                            </span>
                                                        </div>

                                                        <div className="flex items-baseline gap-3 pt-1">
                                                            <span className="font-amiri text-4xl md:text-5xl font-black text-primary leading-none">
                                                                {cand.letter}
                                                            </span>
                                                            <div>
                                                                <h3 className="font-bold text-sm md:text-base text-text-primary">
                                                                    حرف {cand.letterName}
                                                                </h3>
                                                                <span className="text-[11px] text-text-secondary block">
                                                                    {cand.justification}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-border-subtle text-[11px]">
                                                        <div className="flex items-center justify-between text-text-secondary">
                                                            <span>صلة التصاق مباشرة:</span>
                                                            <strong className="text-text-primary font-mono">{cand.attachmentCount.toLocaleString('ar-SA')}</strong>
                                                        </div>
                                                        <div className="flex items-center justify-between text-text-secondary">
                                                            <span>اقتران في نفس الكلمة:</span>
                                                            <strong className="text-text-primary font-mono">{cand.inWordCount.toLocaleString('ar-SA')}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* COMPLETE CIPHER MASTER TABLE & SIMILARITY CLUSTERING */}
                            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-3">
                                            <span>جدول مصفوفة التكويد الشاملة وفرز الأزواج المتشابهة</span>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                                                {columnsLimit === 28 ? 'كامل الـ 28 حرفاً' : `${columnsLimit} أحرف`}
                                            </span>
                                        </h2>
                                        <p className="text-xs md:text-sm text-text-secondary mt-1">
                                            {sortMode === 'similarity_pairs' 
                                                ? 'تم تجميع الحروف النورانية بحيث يوضع كل حرفين الأكثر تشابهاً وتطابقاً تحت بعضهما مباشرة.'
                                                : sortMode === 'similarity_to_active'
                                                    ? `تم فرز الحروف حسب نسبة التشابه والتقارب مع حرف «${selectedNodeLetter}» تنازلياً.`
                                                    : 'مرتبة وفق الترتيب المصحفي المعتاد لظهور الحروف النورانية.'}
                                        </p>
                                    </div>

                                    {/* View & Column Controls */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <span className="text-[11px] font-bold text-text-muted px-2">النتائج:</span>
                                            {[4, 7, 10, 14, 28].map((lim) => (
                                                <button
                                                    key={lim}
                                                    type="button"
                                                    onClick={() => setColumnsLimit(lim)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        columnsLimit === lim
                                                            ? 'bg-primary text-white shadow-2xs'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    {lim === 28 ? 'كامل الـ 28' : `${lim}`}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <button
                                                type="button"
                                                onClick={() => setTableStyle('ranking')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    tableStyle === 'ranking' ? 'bg-amber-600 text-white shadow-2xs' : 'text-text-secondary'
                                                }`}
                                            >
                                                أعمدة الرتب
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTableStyle('heatmap')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    tableStyle === 'heatmap' ? 'bg-amber-600 text-white shadow-2xs' : 'text-text-secondary'
                                                }`}
                                            >
                                                مصفوفة الأبجدية الحرارية (14×28)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SORTING CONTROLS TABS (SIMILARITY CLUSTERING) */}
                                <div className="bg-surface-subtle p-3 rounded-2xl border border-border-default flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-text-muted ml-1">فرز وترتيب الصفوف:</span>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('similarity_pairs')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'similarity_pairs'
                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>🔗</span>
                                            <span>فرز الأزواج الأكثر تشابهاً (تحت بعض)</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('standard')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'standard'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>📋</span>
                                            <span>الترتيب المصحفي القياسي</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('similarity_to_active')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'similarity_to_active'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>🎯</span>
                                            <span>فرز حسب الشبه بـ «{selectedNodeLetter}»</span>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowSimilarityMatrix(!showSimilarityMatrix)}
                                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default hover:border-primary text-text-secondary text-xs font-bold transition-all cursor-pointer"
                                    >
                                        {showSimilarityMatrix ? 'إخفاء مصفوفة التشابه البيني (14×14)' : 'إظهار مصفوفة التشابه البيني (14×14)'}
                                    </button>
                                </div>

                                {/* INTERACTIVE 14 x 14 SIMILARITY MATRIX ACCORDION */}
                                {showSimilarityMatrix && (
                                    <div className="p-4 md:p-5 rounded-2xl bg-surface-subtle border border-amber-500/30 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-amber-800 dark:text-amber-300">
                                                مصفوفة نسب التشابه المتبادلة بين الحروف النورانية الـ 14 (Similarity Matrix):
                                            </span>
                                            <span className="text-text-muted">الخلايا الأكثر اخضراراً تعبر عن أعلى تطابق</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-center border-collapse text-xs font-mono">
                                                <thead>
                                                    <tr className="border-b border-border-default">
                                                        <th className="p-2 font-bold font-amiri text-sm">الحرف</th>
                                                        {cipherResults.map(n => (
                                                            <th key={n.nooraniLetter} className="p-2 font-bold font-amiri text-base text-primary">
                                                                {n.nooraniLetter}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle">
                                                    {cipherResults.map(rNode => (
                                                        <tr key={rNode.nooraniLetter}>
                                                            <td className="p-2 font-bold font-amiri text-base text-primary bg-surface/50">
                                                                {rNode.nooraniLetter}
                                                            </td>
                                                            {cipherResults.map(cNode => {
                                                                const isSelf = rNode.nooraniLetter === cNode.nooraniLetter;
                                                                const sim = similarityData.similarityMatrix[rNode.nooraniLetter]?.[cNode.nooraniLetter] || 0;
                                                                const isTwin = similarityData.bestPartnerMap[rNode.nooraniLetter]?.partnerLetter === cNode.nooraniLetter;

                                                                let bg = 'bg-surface/30 text-text-muted';
                                                                if (isSelf) {
                                                                    bg = 'bg-primary/20 text-primary font-bold';
                                                                } else if (sim >= 85) {
                                                                    bg = 'bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold';
                                                                } else if (sim >= 70) {
                                                                    bg = 'bg-amber-500/20 text-amber-800 dark:text-amber-300';
                                                                }

                                                                return (
                                                                    <td 
                                                                        key={cNode.nooraniLetter}
                                                                        title={`تشابه ${rNode.nooraniLetter} مع ${cNode.nooraniLetter}: ${sim}%`}
                                                                        className={`p-2 transition-colors ${bg} ${isTwin ? 'ring-2 ring-amber-500 font-black' : ''}`}
                                                                    >
                                                                        {isSelf ? '100%' : `${sim}%`}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* MASTER TABLE */}
                                <div className="overflow-x-auto rounded-xl border border-border-default">
                                    {tableStyle === 'ranking' ? (
                                        <table className="w-full text-right border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                                    <th className="p-3 font-bold sticky right-0 bg-surface-subtle z-10">الحرف النوراني</th>
                                                    <th className="p-3 font-bold">الاسم والورود</th>
                                                    <th className="p-3 font-bold">الأقرب شبهاً</th>
                                                    {Array.from({ length: columnsLimit }).map((_, cIdx) => {
                                                        const rankNum = cIdx + 1;
                                                        const medal = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum === 4 ? '🏅' : `#${rankNum}`;
                                                        return (
                                                            <th key={cIdx} className="p-2.5 font-bold text-center min-w-[55px]">
                                                                <span className="block text-[10px] text-text-muted">{medal}</span>
                                                                <span className="font-mono text-xs">المقابل {rankNum}</span>
                                                            </th>
                                                        );
                                                    })}
                                                    <th className="p-3 font-bold">ملاحظات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle font-medium">
                                                {displayedNodes.map((node, rowIdx) => {
                                                    const partnerInfo = similarityData.bestPartnerMap[node.nooraniLetter];
                                                    const isSelected = selectedNodeLetter === node.nooraniLetter;
                                                    const candidatesToShow = node.allCandidates.slice(0, columnsLimit);

                                                    const isPairHeader = sortMode === 'similarity_pairs' && rowIdx % 2 === 0;
                                                    const partnerNode = isPairHeader ? displayedNodes[rowIdx + 1] : null;
                                                    const pairSim = partnerNode ? similarityData.similarityMatrix[node.nooraniLetter]?.[partnerNode.nooraniLetter] : 0;
                                                    const pairNum = Math.floor(rowIdx / 2) + 1;

                                                    return (
                                                        <React.Fragment key={node.nooraniLetter}>
                                                            {isPairHeader && partnerNode && (
                                                                <tr className="bg-amber-500/10 border-t-2 border-b border-amber-500/30">
                                                                    <td colSpan={columnsLimit + 4} className="py-2 px-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-mono">
                                                                                    {pairNum}
                                                                                </span>
                                                                                <span className="text-sm">
                                                                                    🔗 الزوج المتطابق #{pairNum}: حرف «{node.nooraniLetter}» وحرف «{partnerNode.nooraniLetter}»
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono text-xs">
                                                                                    نسبة التشابه: {pairSim}%
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-text-muted font-normal">
                                                                                أبرز الحروف المشتركة بينهما: <strong>{partnerInfo?.sharedLetters?.slice(0, 5).join('، ') || '-'}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            <tr 
                                                                onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                                                className={`hover:bg-surface-subtle/80 cursor-pointer transition-colors ${
                                                                    isSelected ? 'bg-amber-500/15' : ''
                                                                }`}
                                                            >
                                                                <td className="p-3 sticky right-0 bg-surface z-10">
                                                                    <span className="font-amiri text-3xl font-bold text-primary inline-block w-8 text-center leading-none">
                                                                        {node.nooraniLetter}
                                                                    </span>
                                                                </td>

                                                                <td className="p-3 text-xs whitespace-nowrap">
                                                                    <div className="font-bold text-text-primary">
                                                                        {node.nooraniLetterName.replace(' (واو القسم المقترنة بـ ن، ق، ص)', '')}
                                                                    </div>
                                                                    <span className="text-text-muted font-mono">
                                                                        {node.totalOccurrences.toLocaleString('ar-SA')} موضع
                                                                    </span>
                                                                </td>

                                                                <td className="p-3 text-xs whitespace-nowrap">
                                                                    {partnerInfo ? (
                                                                        <span 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedNodeLetter(partnerInfo.partnerLetter);
                                                                            }}
                                                                            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-amber-500/20 border border-border-default text-text-primary text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="انقر للانتقال للحرف الشبيه"
                                                                        >
                                                                            <span className="font-amiri text-sm">{partnerInfo.partnerLetter}</span>
                                                                            <span className="font-mono text-amber-600 dark:text-amber-400">({partnerInfo.similarity}%)</span>
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>

                                                                {candidatesToShow.map((c, cIdx) => {
                                                                    const isTop3 = cIdx < 3;
                                                                    return (
                                                                        <td 
                                                                            key={cIdx} 
                                                                            className={`p-2 text-center transition-colors min-w-[55px] ${
                                                                                isTop3 ? 'bg-amber-500/5' : ''
                                                                            }`}
                                                                        >
                                                                            <span className={`font-amiri text-lg font-bold block leading-none ${
                                                                                isTop3 ? 'text-primary' : 'text-text-primary'
                                                                            }`}>
                                                                                {c.letter}
                                                                            </span>
                                                                            <span className="text-[10px] text-text-muted font-mono block mt-0.5">
                                                                                {c.score}ن
                                                                            </span>
                                                                        </td>
                                                                    );
                                                                })}

                                                                <td className="p-3 text-xs text-text-muted whitespace-nowrap">
                                                                    {node.hasWawBond ? (
                                                                        <span className="text-amber-700 dark:text-amber-300 font-bold">
                                                                            {node.wawBondDetails}
                                                                        </span>
                                                                    ) : (
                                                                        <span>{node.fawatihSurahs.length} سور فواتح</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-right border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-border-default bg-surface-subtle text-text-secondary">
                                                    <th className="p-3 font-bold sticky right-0 bg-surface-subtle z-10">الحرف النوراني</th>
                                                    {ARABIC_ALPHABET_28.map(a => (
                                                        <th key={a.letter} className="p-2 text-center font-amiri text-base font-bold min-w-[40px]">
                                                            {a.letter}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle font-medium">
                                                {displayedNodes.map((node, rowIdx) => {
                                                    const isSelected = selectedNodeLetter === node.nooraniLetter;
                                                    const scoreMap = new Map<string, { rank: number; score: number }>();
                                                    node.allCandidates.forEach(c => scoreMap.set(c.letter, { rank: c.rank, score: c.score }));

                                                    const isPairHeader = sortMode === 'similarity_pairs' && rowIdx % 2 === 0;
                                                    const partnerNode = isPairHeader ? displayedNodes[rowIdx + 1] : null;
                                                    const pairSim = partnerNode ? similarityData.similarityMatrix[node.nooraniLetter]?.[partnerNode.nooraniLetter] : 0;
                                                    const pairNum = Math.floor(rowIdx / 2) + 1;

                                                    return (
                                                        <React.Fragment key={node.nooraniLetter}>
                                                            {isPairHeader && partnerNode && (
                                                                <tr className="bg-amber-500/10 border-t-2 border-b border-amber-500/30">
                                                                    <td colSpan={30} className="py-1.5 px-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                        <span>🔗 الزوج المتطابق #{pairNum}: «{node.nooraniLetter}» و «{partnerNode.nooraniLetter}» (تشابه {pairSim}%)</span>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr
                                                                onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                                                className={`hover:bg-surface-subtle/80 cursor-pointer ${
                                                                    isSelected ? 'bg-amber-500/15' : ''
                                                                }`}
                                                            >
                                                                <td className="p-2.5 sticky right-0 bg-surface z-10 whitespace-nowrap">
                                                                    <span className="font-amiri text-2xl font-bold text-primary mr-1">
                                                                        {node.nooraniLetter}
                                                                    </span>
                                                                    <span className="text-[11px] text-text-muted">({node.nooraniLetterName})</span>
                                                                </td>

                                                                {ARABIC_ALPHABET_28.map(a => {
                                                                    const item = scoreMap.get(a.letter);
                                                                    const rank = item ? item.rank : 99;
                                                                    const score = item ? item.score : 0;

                                                                    let cellClass = 'bg-surface/20 text-text-muted';
                                                                    if (rank <= 3) {
                                                                        cellClass = 'bg-amber-500/35 font-black text-amber-900 dark:text-amber-200';
                                                                    } else if (rank <= 7) {
                                                                        cellClass = 'bg-amber-500/20 font-bold text-text-primary';
                                                                    } else if (rank <= 14) {
                                                                        cellClass = 'bg-primary/10 text-text-primary';
                                                                    }

                                                                    return (
                                                                        <td
                                                                            key={a.letter}
                                                                            title={`${node.nooraniLetter} ↔ ${a.letter}: رتبة #${rank} (درجة: ${score}ن)`}
                                                                            className={`p-1.5 text-center font-mono transition-colors ${cellClass}`}
                                                                        >
                                                                            {item ? (
                                                                                <div>
                                                                                    <span className="block text-[11px] font-bold">#{rank}</span>
                                                                                    <span className="text-[9px] opacity-75">{score}ن</span>
                                                                                </div>
                                                                            ) : '-'}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CIPHER PLAYGROUND / DECRYPTOR */}
                    {activeMainTab === 'playground' && (
                        <div className="space-y-6">
                            <NooraniCipherLab simpleCleanData={simpleCleanData} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NooraniReverseCipherView;
