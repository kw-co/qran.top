import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { getArabicRoot } from '../utils/roots';
import { QURAN_INDEX } from '../quranIndex';
import { SearchIcon, ClearIcon, CopyIcon, CheckIcon } from './icons';
import { LetterExclusiveLexicon } from './LetterExclusiveLexicon';
import { SurahPairingView } from './SurahPairingView';

interface MuqattaatViewProps {
    simpleCleanData: SurahData[];
    onWordClick?: (query: string, isRoot: boolean) => void;
    initialTab?: 'intersection' | 'lexicon' | 'pairing';
    initialSurahNumber?: number;
}

export interface IntersectionResults {
    words: AggregateWord[];
    roots: AggregateRoot[];
    ayahs: IntersectingAyahItem[];
    numSelected: number;
    minRequiredSurahs: number;
}

export const MUQATTAAT_SURAHS: Record<number, string> = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر", 15: "الر",
    19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم", 31: "الم", 32: "الم",
    36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم", 44: "حم", 45: "حم", 46: "حم",
    50: "ق", 68: "ن"
};

const ALL_LETTERS = ['ا', 'ح', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'ي'];

// Standard Quranic stopwords to keep content words meaningful
const STOP_WORDS = new Set([
    "في", "من", "على", "إلى", "أن", "إن", "ولا", "بما", "وما", "الذي", "التي", "هم", "كانوا", "هو", "هي",
    "يا", "أيها", "ياأيها", "الذين", "لهم", "بهم", "فيهم", "عليهم", "إليهم", "ثم", "أو", "أم", "بل", "قد",
    "لقد", "فما", "كما", "فلما", "كلما", "ألم", "أفلم", "أولم", "فهل", "هل", "عن", "لو", "لولا", "لوما",
    "حتى", "لما", "إلا", "لا", "ما", "ذا", "هذا", "هذه", "ذلك", "تلك", "ذلكم", "هؤلاء", "كل", "كان", "قال",
    "قالوا", "قل", "إذا", "إذ", "فإذا", "وإذا", "وإن", "فإن", "ألا", "غير", "بين", "دون", "عند", "مع"
]);

// Helper to strip "سورة" and diacritics to get pure compact surah names
export const getCleanSurahName = (name: string): string => {
    if (!name) return '';
    let clean = name.replace(/^سُورَةُ\s*/, '').replace(/^سورة\s*/, '').trim();
    clean = clean.replace(/\u0627\u0653/g, 'آ');
    clean = clean.replace(/[\u064B-\u0652\u0654-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
    return clean || name;
};

// Quick predefined Quranic groups for instant multi-filtering
const PRESET_GROUPS = [
    { label: "كل السور (114)", ids: Array.from({ length: 114 }, (_, i) => i + 1) },
    { label: "سور الحروف (29)", ids: Object.keys(MUQATTAAT_SURAHS).map(Number) },
    { label: "الحواميم (7)", ids: [40, 41, 42, 43, 44, 45, 46] },
    { label: "ذوات (الم) (6)", ids: [2, 3, 29, 30, 31, 32] },
    { label: "ذوات (الر) (5)", ids: [10, 11, 12, 14, 15] },
    { label: "الطواسين (3)", ids: [26, 27, 28] },
    { label: "البقرة وآل عمران", ids: [2, 3] },
];

interface AggregateWord {
    word: string;
    total: number;
    surahCount: number;
    bySurah: Record<number, number>;
}

interface AggregateRoot {
    root: string;
    total: number;
    surahCount: number;
    bySurah: Record<number, number>;
}

interface MuqattaatBadge {
    letters: string;
    count: number;
    label: string;
}

interface IntersectingAyahItem {
    id: string;
    text: string;
    normText: string;
    occurrences: Array<{
        surahNumber: number;
        surahName: string;
        ayahNumber: number;
    }>;
    matchType: 'exact' | 'phrase' | 'words';
    sharedWords: string[];
    sharedWordsCount: number;
    pairText2?: string;
    pairAyah2Number?: number;
    pairSurah2Number?: number;
    pairSurah2Name?: string;
    isSameSurahRepeat: boolean;
    muqattaatBadges: MuqattaatBadge[];
}

// Precomputes Noorani letter badges and same-surah status once to avoid recomputation on render
const computeAyahMeta = (
    occurrences: Array<{ surahNumber: number; surahName: string; ayahNumber: number }>,
    pairSurah2Number?: number,
    pairAyah2Number?: number
): { isSameSurahRepeat: boolean; muqattaatBadges: MuqattaatBadge[] } => {
    const allSurahRefs: number[] = [];
    occurrences.forEach(o => allSurahRefs.push(o.surahNumber));
    if (pairSurah2Number && !occurrences.some(o => o.surahNumber === pairSurah2Number && o.ayahNumber === pairAyah2Number)) {
        allSurahRefs.push(pairSurah2Number);
    }

    const uniqueSurahs = new Set(allSurahRefs);
    const isSameSurahRepeat = uniqueSurahs.size === 1;

    const muqattaatCounts = new Map<string, number>();
    allSurahRefs.forEach(sId => {
        const letters = MUQATTAAT_SURAHS[sId];
        if (letters) {
            muqattaatCounts.set(letters, (muqattaatCounts.get(letters) || 0) + 1);
        }
    });

    const muqattaatBadges = Array.from(muqattaatCounts.entries()).map(([letters, count]) => ({
        letters,
        count,
        label: count > 1 ? `${letters}${count}` : letters
    }));

    return { isSameSurahRepeat, muqattaatBadges };
};

export const MuqattaatView: React.FC<MuqattaatViewProps> = ({ 
    simpleCleanData, 
    onWordClick, 
    initialTab, 
    initialSurahNumber 
}) => {
    // View mode toggle: 'lexicon' | 'intersection' | 'pairing'
    const [mainViewMode, setMainViewMode] = useState<'intersection' | 'lexicon' | 'pairing'>(initialTab || 'lexicon');

    // Keep state in sync if initialTab prop changes
    useEffect(() => {
        if (initialTab && initialTab !== mainViewMode) {
            setMainViewMode(initialTab);
        }
    }, [initialTab]);

    // Multi-Surah filter selection (can select 1, 2, 3, 4 ... or all 114 surahs)
    const [selectedSurahIds, setSelectedSurahIds] = useState<number[]>([]);

    // Display scope: 'all' (114), 'muqattaat' (29), or 'selected' (only currently selected)
    const [gridScope, setGridScope] = useState<'all' | 'muqattaat' | 'selected'>('all');

    // Noorani letters filter
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

    // Search query for filtering surahs
    const [surahSearch, setSurahSearch] = useState('');

    // Active Results Tab
    const [activeTab, setActiveTab] = useState<'words' | 'roots' | 'ayahs'>('words');

    // Strictness for intersection when 3+ surahs are selected
    const [strictness, setStrictness] = useState<'all' | 'majority' | 'half'>('all');

    // Sub-filters inside results
    const [wordFilter, setWordFilter] = useState('');
    const [rootFilter, setRootFilter] = useState('');
    const [ayahFilter, setAyahFilter] = useState('');
    const [ayahRepeatFilter, setAyahRepeatFilter] = useState<'all' | 'cross' | 'same'>('all');
    const [copiedTab, setCopiedTab] = useState<string | null>(null);

    // Fast Batching/Pagination to prevent UI freezing on tab switch
    const INITIAL_AYAH_BATCH = 30;
    const [visibleAyahCount, setVisibleAyahCount] = useState(INITIAL_AYAH_BATCH);

    const INITIAL_ROOT_BATCH = 100;
    const [visibleRootCount, setVisibleRootCount] = useState(INITIAL_ROOT_BATCH);

    const INITIAL_WORD_BATCH = 120;
    const [visibleWordCount, setVisibleWordCount] = useState(INITIAL_WORD_BATCH);

    // Asynchronous calculation & progress states to prevent browser freeze
    const [isCalculating, setIsCalculating] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');
    const [intersectionResults, setIntersectionResults] = useState<IntersectionResults | null>(null);
    const abortRef = useRef<number>(0);

    // Helpers
    const cleanWord = useCallback((word: string): string => {
        let nw = normalizeArabicText(word).replace(/[^\u0621-\u064A]/g, '');
        if (nw.length < 2) return '';
        const prefixes = ["وال", "فال", "بال", "كال", "ال", "ول", "فل", "لل", "و", "ف", "ب", "ك", "ل"];
        for (const p of prefixes) {
            if (nw.startsWith(p) && nw.length - p.length >= 2) {
                nw = nw.substring(p.length);
                break;
            }
        }
        const suffixes = ["هما", "هن", "هم", "كم", "نا", "ها", "وا", "ون", "ين", "ات"];
        for (const s of suffixes) {
            if (nw.endsWith(s) && nw.length - s.length >= 2) {
                nw = nw.substring(0, nw.length - s.length);
                break;
            }
        }
        return nw;
    }, []);

    const normalizeAyah = useCallback((t: string) => {
        return normalizeArabicText(t).replace(/\s+/g, ' ').trim();
    }, []);

    // Precompute vocabulary and roots per Surah for instant multi-surah intersections
    const surahVocabMap = useMemo(() => {
        const map = new Map<number, {
            wordCounts: Map<string, number>;
            rootCounts: Map<string, number>;
            ayahs: Array<{ numberInSurah: number; text: string; normText: string; contentWords: Set<string> }>;
        }>();

        simpleCleanData.forEach(surah => {
            const wordCounts = new Map<string, number>();
            const rootCounts = new Map<string, number>();
            const ayahs: Array<{ numberInSurah: number; text: string; normText: string; contentWords: Set<string> }> = [];

            surah.ayahs.forEach(a => {
                if (!a.text) return;
                const normText = normalizeAyah(a.text);
                const words = a.text.split(/\s+/);
                const contentWords = new Set<string>();

                words.forEach(rawW => {
                    const cw = cleanWord(rawW);
                    const nw = normalizeArabicText(rawW).replace(/[^\u0621-\u064A]/g, '');
                    if (cw.length >= 2 && !STOP_WORDS.has(cw) && !STOP_WORDS.has(nw)) {
                        contentWords.add(cw);
                        wordCounts.set(cw, (wordCounts.get(cw) || 0) + 1);
                        const root = getArabicRoot(nw);
                        if (root && root.length >= 3) {
                            rootCounts.set(root, (rootCounts.get(root) || 0) + 1);
                        }
                    }
                });

                ayahs.push({
                    numberInSurah: a.numberInSurah,
                    text: a.text,
                    normText,
                    contentWords
                });
            });

            map.set(surah.number, { wordCounts, rootCounts, ayahs });
        });

        return map;
    }, [simpleCleanData, cleanWord, normalizeAyah]);

    // Surahs displayed in compact buttons list
    const displayedSurahs = useMemo(() => {
        let ids: number[] = [];

        if (gridScope === 'selected') {
            ids = selectedSurahIds.length > 0 ? selectedSurahIds : Array.from({ length: 114 }, (_, i) => i + 1);
        } else if (gridScope === 'muqattaat') {
            ids = Object.keys(MUQATTAAT_SURAHS).map(Number);
        } else {
            ids = Array.from({ length: 114 }, (_, i) => i + 1);
        }

        // If Noorani letters filter is applied
        if (selectedLetters.length > 0) {
            ids = ids.filter(id => {
                const muq = MUQATTAAT_SURAHS[id];
                if (!muq) return false;
                return selectedLetters.some(l => muq.includes(l));
            });
        }

        // Surah search query
        if (surahSearch.trim()) {
            const queryNorm = normalizeArabicText(surahSearch.trim()).toLowerCase();
            ids = ids.filter(id => {
                const sData = simpleCleanData.find(s => s.number === id);
                const sRef = QURAN_INDEX.find(s => s.number === id);
                const nameNorm = normalizeArabicText(sData?.name || sRef?.name || '');
                const engNorm = (sRef?.englishName || '').toLowerCase();
                const muq = MUQATTAAT_SURAHS[id] ? normalizeArabicText(MUQATTAAT_SURAHS[id]) : '';
                return nameNorm.includes(queryNorm) || engNorm.includes(queryNorm) || String(id) === queryNorm || (muq && muq.includes(queryNorm));
            });
        }

        return ids.map(id => {
            const sData = simpleCleanData.find(s => s.number === id);
            const sRef = QURAN_INDEX.find(s => s.number === id);
            const rawName = sData?.name || sRef?.name || `${id}`;
            return {
                number: id,
                cleanName: getCleanSurahName(rawName),
                rawName,
                muqattaat: MUQATTAAT_SURAHS[id] || null
            };
        });
    }, [gridScope, selectedSurahIds, selectedLetters, surahSearch, simpleCleanData]);

    // Toggle a single surah in/out of the multi-filter
    const toggleSurah = (surahNumber: number) => {
        setSelectedSurahIds(prev =>
            prev.includes(surahNumber) ? prev.filter(id => id !== surahNumber) : [...prev, surahNumber]
        );
    };

    // Toggle Noorani letter
    const toggleLetter = (letter: string) => {
        setSelectedLetters(prev =>
            prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
        );
    };

    // Select all currently visible surahs
    const selectAllVisible = () => {
        const visibleIds = displayedSurahs.map(s => s.number);
        setSelectedSurahIds(Array.from(new Set([...selectedSurahIds, ...visibleIds])));
    };

    // Multi-Surah Intersections Calculation (Asynchronous & Non-Blocking with Progress Tracking)
    useEffect(() => {
        if (selectedSurahIds.length === 0) {
            setIsCalculating(false);
            setProgressPercent(0);
            setProgressStatus('');
            setIntersectionResults(null);
            return;
        }

        const currentId = ++abortRef.current;
        setIsCalculating(true);
        setProgressPercent(10);
        setProgressStatus('جاري تهيئة التحليل وجمع الكلمات والجذور...');

        const runCalculation = async () => {
            // Yield immediately to let React render the progress bar
            await new Promise(resolve => setTimeout(resolve, 20));
            if (abortRef.current !== currentId) return;

            const numSelected = selectedSurahIds.length;
            const minRequiredSurahs =
                numSelected === 1
                    ? 1
                    : strictness === 'all'
                    ? numSelected
                    : strictness === 'majority'
                    ? Math.ceil(numSelected * 0.75)
                    : Math.ceil(numSelected * 0.5);

            // 1. Common Words Aggregation
            const wordAgg = new Map<string, { total: number; surahCount: number; bySurah: Record<number, number> }>();
            const rootAgg = new Map<string, { total: number; surahCount: number; bySurah: Record<number, number> }>();

            selectedSurahIds.forEach(id => {
                const vocab = surahVocabMap.get(id);
                if (!vocab) return;

                vocab.wordCounts.forEach((count, word) => {
                    const cur = wordAgg.get(word) || { total: 0, surahCount: 0, bySurah: {} };
                    cur.total += count;
                    cur.surahCount += 1;
                    cur.bySurah[id] = count;
                    wordAgg.set(word, cur);
                });

                vocab.rootCounts.forEach((count, root) => {
                    const cur = rootAgg.get(root) || { total: 0, surahCount: 0, bySurah: {} };
                    cur.total += count;
                    cur.surahCount += 1;
                    cur.bySurah[id] = count;
                    rootAgg.set(root, cur);
                });
            });

            // Filter words and roots according to threshold
            const words: AggregateWord[] = [];
            wordAgg.forEach((info, word) => {
                if (info.surahCount >= minRequiredSurahs) {
                    words.push({ word, ...info });
                }
            });

            const roots: AggregateRoot[] = [];
            rootAgg.forEach((info, root) => {
                if (info.surahCount >= minRequiredSurahs) {
                    roots.push({ root, ...info });
                }
            });

            setProgressPercent(25);
            setProgressStatus('جاري مطابقة الآيات التامة والمكررة...');
            await new Promise(resolve => setTimeout(resolve, 10));
            if (abortRef.current !== currentId) return;

            // 2. Intersecting Ayahs (الآيات المتقاطعة والمتشابهة - سواء بين السور أو مكررة في نفس السورة)
            const ayahs: IntersectingAyahItem[] = [];

            // 2.1 Index all ayahs across selected surahs to find exact recurring verses
            const ayahNormMap = new Map<string, {
                text: string;
                normText: string;
                contentWords: Set<string>;
                occurrences: Array<{ surahNumber: number; surahName: string; ayahNumber: number }>;
            }>();

            selectedSurahIds.forEach(sId => {
                const vocab = surahVocabMap.get(sId);
                const sName = getCleanSurahName(QURAN_INDEX.find(s => s.number === sId)?.name || `${sId}`);
                if (!vocab) return;

                vocab.ayahs.forEach(a => {
                    const cur = ayahNormMap.get(a.normText) || {
                        text: a.text,
                        normText: a.normText,
                        contentWords: a.contentWords,
                        occurrences: []
                    };
                    cur.occurrences.push({
                        surahNumber: sId,
                        surahName: sName,
                        ayahNumber: a.numberInSurah
                    });
                    ayahNormMap.set(a.normText, cur);
                });
            });

            // Exact matches: across 2+ surahs OR repeated 2+ times in the same surah
            ayahNormMap.forEach((info, norm) => {
                const uniqueSurahs = new Set(info.occurrences.map(o => o.surahNumber));
                if (uniqueSurahs.size >= 2 || info.occurrences.length >= 2) {
                    const wordsCount = info.text.split(/\s+/).filter(Boolean).length;
                    const sharedList = Array.from(new Set(info.text.split(/\s+/).map(w => cleanWord(w)).filter(Boolean)));
                    const meta = computeAyahMeta(info.occurrences);
                    ayahs.push({
                        id: `exact-${norm.substring(0, 20)}-${info.occurrences[0].surahNumber}-${info.occurrences[0].ayahNumber}`,
                        text: info.text,
                        normText: info.normText,
                        matchType: 'exact',
                        sharedWords: sharedList,
                        sharedWordsCount: wordsCount,
                        occurrences: info.occurrences,
                        isSameSurahRepeat: meta.isSameSurahRepeat,
                        muqattaatBadges: meta.muqattaatBadges
                    });
                }
            });

            setProgressPercent(40);
            await new Promise(resolve => setTimeout(resolve, 10));
            if (abortRef.current !== currentId) return;

            // 2.2 Overlap & phrase similarities (المتشابهات اللفظية والعبارات)
            // عند اختيار حتى 3 سور، يتم فحص التشابه الجزئي سواء بين السور أو داخل نفس السورة
            if (numSelected <= 3) {
                setProgressStatus('جاري استخراج المتشابهات اللفظية والعبارات...');
                const allAyahsList: Array<{
                    surahNumber: number;
                    surahName: string;
                    ayahNumber: number;
                    text: string;
                    normText: string;
                    contentWords: Set<string>;
                    trigrams: string[];
                }> = [];

                selectedSurahIds.forEach(sId => {
                    const vocab = surahVocabMap.get(sId);
                    const sName = getCleanSurahName(QURAN_INDEX.find(s => s.number === sId)?.name || `${sId}`);
                    if (!vocab) return;
                    vocab.ayahs.forEach(a => {
                        const words = a.text.split(/\s+/);
                        const trigrams: string[] = [];
                        for (let p = 0; p <= words.length - 3; p++) {
                            const phrase = words.slice(p, p + 3).map(w => normalizeArabicText(w)).join(' ');
                            if (phrase.length >= 8) {
                                trigrams.push(phrase);
                            }
                        }
                        allAyahsList.push({
                            surahNumber: sId,
                            surahName: sName,
                            ayahNumber: a.numberInSurah,
                            text: a.text,
                            normText: a.normText,
                            contentWords: a.contentWords,
                            trigrams
                        });
                    });
                });

                // Build fast inverted indices for candidates
                const trigramIndex = new Map<string, number[]>();
                const wordIndex = new Map<string, number[]>();

                allAyahsList.forEach((a, idx) => {
                    a.trigrams.forEach(tg => {
                        if (!trigramIndex.has(tg)) trigramIndex.set(tg, []);
                        trigramIndex.get(tg)!.push(idx);
                    });
                    a.contentWords.forEach(cw => {
                        if (!wordIndex.has(cw)) wordIndex.set(cw, []);
                        wordIndex.get(cw)!.push(idx);
                    });
                });

                const seenPairs = new Set<string>();
                const totalAyahs = allAyahsList.length;
                const batchSize = 35;

                for (let i = 0; i < totalAyahs; i++) {
                    if (i > 0 && i % batchSize === 0) {
                        const currentPercent = Math.min(94, Math.round(40 + (i / totalAyahs) * 54));
                        setProgressPercent(currentPercent);
                        setProgressStatus(`جاري تحليل الآيات والمتشابهات (${i} من ${totalAyahs} آية)...`);
                        await new Promise(resolve => setTimeout(resolve, 0));
                        if (abortRef.current !== currentId) return;
                    }

                    const a1 = allAyahsList[i];
                    if (a1.text.split(/\s+/).length < 3) continue;

                    // Collect candidates sharing trigrams or content words
                    const candidateCounts = new Map<number, { count: number; hasTrigram: boolean }>();

                    a1.trigrams.forEach(tg => {
                        const matches = trigramIndex.get(tg);
                        if (matches) {
                            matches.forEach(j => {
                                if (j > i) {
                                    const c = candidateCounts.get(j) || { count: 0, hasTrigram: false };
                                    c.hasTrigram = true;
                                    candidateCounts.set(j, c);
                                }
                            });
                        }
                    });

                    a1.contentWords.forEach(cw => {
                        const matches = wordIndex.get(cw);
                        if (matches) {
                            matches.forEach(j => {
                                if (j > i) {
                                    const c = candidateCounts.get(j) || { count: 0, hasTrigram: false };
                                    c.count += 1;
                                    candidateCounts.set(j, c);
                                }
                            });
                        }
                    });

                    candidateCounts.forEach((cand, j) => {
                        const a2 = allAyahsList[j];
                        if (a1.normText === a2.normText) return;

                        const pairKey = `${a1.surahNumber}:${a1.ayahNumber}-${a2.surahNumber}:${a2.ayahNumber}`;
                        if (seenPairs.has(pairKey)) return;

                        const shared: string[] = [];
                        a2.contentWords.forEach(cw => {
                            if (a1.contentWords.has(cw)) {
                                shared.push(cw);
                            }
                        });

                        let hasConsecutive3 = false;
                        if (cand.hasTrigram) {
                            for (let p = 0; p < a2.trigrams.length; p++) {
                                if (a1.normText.includes(a2.trigrams[p])) {
                                    hasConsecutive3 = true;
                                    break;
                                }
                            }
                        }

                        if (hasConsecutive3 || shared.length >= 3) {
                            seenPairs.add(pairKey);
                            const occurrences = [
                                { surahNumber: a1.surahNumber, surahName: a1.surahName, ayahNumber: a1.ayahNumber },
                                { surahNumber: a2.surahNumber, surahName: a2.surahName, ayahNumber: a2.ayahNumber }
                            ];
                            const meta = computeAyahMeta(occurrences, a2.surahNumber, a2.ayahNumber);
                            ayahs.push({
                                id: `sim-${pairKey}`,
                                text: a1.text,
                                normText: a1.normText,
                                pairText2: a2.text,
                                pairAyah2Number: a2.ayahNumber,
                                pairSurah2Number: a2.surahNumber,
                                pairSurah2Name: a2.surahName,
                                matchType: hasConsecutive3 ? 'phrase' : 'words',
                                sharedWords: shared,
                                sharedWordsCount: shared.length,
                                occurrences,
                                isSameSurahRepeat: meta.isSameSurahRepeat,
                                muqattaatBadges: meta.muqattaatBadges
                            });
                        }
                    });
                }
            }

            setProgressPercent(96);
            setProgressStatus('جاري ترتيب النتائج وتجهيز العرض...');
            await new Promise(resolve => setTimeout(resolve, 0));
            if (abortRef.current !== currentId) return;

            // USER RULE: ترتيب الآيات الأكثر كلمات مشتركة أولاً ثم الأقل اشتراكاً
            ayahs.sort((a, b) => b.sharedWordsCount - a.sharedWordsCount);

            setProgressPercent(100);
            setProgressStatus('اكتمل التحليل بنجاح');

            setIntersectionResults({
                words,
                roots,
                ayahs,
                numSelected,
                minRequiredSurahs
            });
            setIsCalculating(false);
        };

        runCalculation();

        return () => {
            abortRef.current = currentId + 1;
        };
    }, [selectedSurahIds, strictness, surahVocabMap, cleanWord]);

    // Sub-filtered words (just the words, compact)
    const displayWords = useMemo(() => {
        if (!intersectionResults) return [];
        let list = [...intersectionResults.words];
        if (wordFilter.trim()) {
            const q = normalizeArabicText(wordFilter.trim());
            list = list.filter(w => normalizeArabicText(w.word).includes(q));
        }
        // Sort by frequency descending
        list.sort((a, b) => b.total - a.total);
        return list;
    }, [intersectionResults, wordFilter]);

    // Sub-filtered roots
    const displayRoots = useMemo(() => {
        if (!intersectionResults) return [];
        let list = [...intersectionResults.roots];
        if (rootFilter.trim()) {
            const q = normalizeArabicText(rootFilter.trim());
            list = list.filter(r => normalizeArabicText(r.root).includes(q));
        }
        list.sort((a, b) => b.total - a.total);
        return list;
    }, [intersectionResults, rootFilter]);

    // Counts for same-surah vs cross-surahs repetitions (instant O(1) via precomputed meta)
    const { sameSurahAyahsCount, crossSurahAyahsCount } = useMemo(() => {
        if (!intersectionResults) return { sameSurahAyahsCount: 0, crossSurahAyahsCount: 0 };
        let same = 0;
        let cross = 0;
        intersectionResults.ayahs.forEach(item => {
            if (item.isSameSurahRepeat) {
                same++;
            } else {
                cross++;
            }
        });
        return { sameSurahAyahsCount: same, crossSurahAyahsCount: cross };
    }, [intersectionResults]);

    // Sub-filtered ayahs sorted by shared words count descending
    const displayAyahs = useMemo(() => {
        if (!intersectionResults) return [];
        let list = [...intersectionResults.ayahs];

        // Filter by repetition scope (all, cross-surahs, same-surah)
        if (ayahRepeatFilter === 'same') {
            list = list.filter(item => item.isSameSurahRepeat);
        } else if (ayahRepeatFilter === 'cross') {
            list = list.filter(item => !item.isSameSurahRepeat);
        }

        if (ayahFilter.trim()) {
            const q = normalizeArabicText(ayahFilter.trim());
            list = list.filter(a =>
                normalizeArabicText(a.text).includes(q) ||
                (a.pairText2 && normalizeArabicText(a.pairText2).includes(q))
            );
        }
        // Always strictly sorted: most shared words first
        list.sort((a, b) => b.sharedWordsCount - a.sharedWordsCount);
        return list;
    }, [intersectionResults, ayahFilter, ayahRepeatFilter]);

    // Reset visible batch counts when changing tab, filter, or results
    useEffect(() => {
        setVisibleAyahCount(INITIAL_AYAH_BATCH);
    }, [ayahFilter, ayahRepeatFilter, activeTab, intersectionResults]);

    useEffect(() => {
        setVisibleRootCount(INITIAL_ROOT_BATCH);
    }, [rootFilter, activeTab, intersectionResults]);

    useEffect(() => {
        setVisibleWordCount(INITIAL_WORD_BATCH);
    }, [wordFilter, activeTab, intersectionResults]);

    // Paginated / Sliced views to guarantee 60fps instant UI switching
    const paginatedAyahs = useMemo(() => {
        return displayAyahs.slice(0, visibleAyahCount);
    }, [displayAyahs, visibleAyahCount]);

    const paginatedRoots = useMemo(() => {
        return displayRoots.slice(0, visibleRootCount);
    }, [displayRoots, visibleRootCount]);

    const paginatedWords = useMemo(() => {
        return displayWords.slice(0, visibleWordCount);
    }, [displayWords, visibleWordCount]);

    // Copy to clipboard
    const copyToClipboard = (text: string, tab: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedTab(tab);
            setTimeout(() => setCopiedTab(null), 2000);
        });
    };

    // Navigate to Ayah
    const navigateToAyah = (surahNumber: number, ayahNumber: number) => {
        window.location.hash = `#/surah/${surahNumber}?ayah=${ayahNumber}`;
    };

    // Highlight shared words in Ayah text (cached and optimized)
    const renderHighlightedAyah = useCallback((text: string, sharedWordsList?: string[]) => {
        if (!sharedWordsList || sharedWordsList.length === 0) return <span>{text}</span>;
        const words = text.split(/(\s+)/);
        const sharedSet = new Set(sharedWordsList.map(w => normalizeArabicText(w)));

        return (
            <span>
                {words.map((chunk, i) => {
                    if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
                    const cleanChunk = cleanWord(chunk);
                    const normChunk = normalizeArabicText(chunk).replace(/[^\u0621-\u064A]/g, '');
                    const isShared = sharedSet.has(cleanChunk) || sharedSet.has(normChunk);
                    return isShared ? (
                        <span key={i} className="bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold px-1 py-0.5 rounded mx-0.5">
                            {chunk}
                        </span>
                    ) : (
                        <span key={i}>{chunk}</span>
                    );
                })}
            </span>
        );
    }, [cleanWord]);

    return (
        <div className="min-h-screen bg-background pb-32" dir="rtl">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-default px-4 py-2.5 shadow-2xs">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm font-quran">الم</span>
                        </div>
                        <div className="flex items-center bg-surface-subtle border border-border-default p-0.5 rounded-lg text-xs font-medium ml-2">
                            <button
                                onClick={() => {
                                    setMainViewMode('lexicon');
                                    window.location.hash = '#/alm?tab=lexicon';
                                }}
                                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                                    mainViewMode === 'lexicon'
                                        ? 'bg-amber-500 text-primary-text-strong shadow-xs font-bold'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                المعجم الخالص
                            </button>
                            <button
                                onClick={() => {
                                    setMainViewMode('intersection');
                                    window.location.hash = '#/alm?tab=intersection';
                                }}
                                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                                    mainViewMode === 'intersection'
                                        ? 'bg-primary text-primary-text-strong shadow-xs font-bold'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                تقاطع السور
                            </button>
                            <button
                                onClick={() => {
                                    setMainViewMode('pairing');
                                    window.location.hash = '#/alm?tab=pairing';
                                }}
                                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    mainViewMode === 'pairing'
                                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                أزواج السور
                            </button>
                        </div>
                    </div>

                    {/* Active Selected Counter (only in intersection mode) */}
                    {mainViewMode === 'intersection' && (
                        <div className="flex items-center gap-2">
                            {selectedSurahIds.length > 0 && (
                                <button
                                    onClick={() => setSelectedSurahIds([])}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <ClearIcon className="w-3.5 h-3.5" />
                                    <span>إلغاء التحديد ({selectedSurahIds.length})</span>
                                </button>
                            )}
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                                {selectedSurahIds.length === 0
                                    ? 'كل السور معروضة (اضغط للتصفية)'
                                    : `${selectedSurahIds.length} سورة محددة`}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4">
                {mainViewMode === 'pairing' ? (
                    <SurahPairingView
                        simpleCleanData={simpleCleanData}
                        initialSurahNumber={initialSurahNumber || 19}
                        onWordClick={onWordClick}
                        navigateToAyah={(surahNum, ayahNum) => {
                            window.location.hash = `#/surah/${surahNum}?ayah=${ayahNum}`;
                        }}
                    />
                ) : mainViewMode === 'lexicon' ? (
                    <LetterExclusiveLexicon
                        simpleCleanData={simpleCleanData}
                        onWordClick={onWordClick}
                        navigateToAyah={(surahNum, ayahNum) => {
                            window.location.hash = `#/surah/${surahNum}?ayah=${ayahNum}`;
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* 1. COMPACT SURAH BUTTONS GRID (USER REQUEST: أزرار صغيرة بجانب بعض، بدون كلمة سورة، بدون رقم، وبدون عدد الآيات) */}
                <section className="bg-surface border border-border-default rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
                    {/* Grid Controls Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-text-primary">السور ({displayedSurahs.length}):</span>
                            {/* Scope Selector */}
                            <div className="flex items-center bg-surface-subtle border border-border-default p-0.5 rounded-lg text-xs font-medium">
                                <button
                                    onClick={() => setGridScope('all')}
                                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                        gridScope === 'all'
                                            ? 'bg-primary text-primary-text-strong font-bold'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    كل السور (114)
                                </button>
                                <button
                                    onClick={() => setGridScope('muqattaat')}
                                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                        gridScope === 'muqattaat'
                                            ? 'bg-primary text-primary-text-strong font-bold'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    سور الحروف (29)
                                </button>
                                {selectedSurahIds.length > 0 && (
                                    <button
                                        onClick={() => setGridScope('selected')}
                                        className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                            gridScope === 'selected'
                                                ? 'bg-primary text-primary-text-strong font-bold'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        المحددة ({selectedSurahIds.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search Input & Select All */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-48">
                                <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="بحث عن سورة..."
                                    value={surahSearch}
                                    onChange={(e) => setSurahSearch(e.target.value)}
                                    className="w-full text-xs bg-surface-subtle text-text-primary border border-border-default rounded-lg pr-7 pl-2 py-1 focus:outline-hidden focus:border-primary"
                                />
                            </div>

                            <button
                                onClick={selectAllVisible}
                                className="text-xs px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default transition-all cursor-pointer whitespace-nowrap"
                                title="تحديد جميع السور المعروضة"
                            >
                                تحديد الكل
                            </button>
                        </div>
                    </div>

                    {/* Quick Presets Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-default/60">
                        <span className="text-[11px] text-text-muted ml-1">مجموعات سريعة:</span>
                        {PRESET_GROUPS.map(group => {
                            const isFullyActive = group.ids.length === selectedSurahIds.length &&
                                group.ids.every(id => selectedSurahIds.includes(id));
                            return (
                                <button
                                    key={group.label}
                                    onClick={() => setSelectedSurahIds(group.ids)}
                                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                        isFullyActive
                                            ? 'bg-primary text-primary-text-strong border-primary font-bold'
                                            : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary border-border-default'
                                    }`}
                                >
                                    {group.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Noorani Letters Pills (Single Row) */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border-default/60">
                        <span className="text-[11px] text-text-muted ml-1">تصفية بالحرف:</span>
                        {ALL_LETTERS.map(letter => {
                            const isSelected = selectedLetters.includes(letter);
                            return (
                                <button
                                    key={letter}
                                    onClick={() => toggleLetter(letter)}
                                    className={`w-6 h-6 rounded-md text-xs font-quran flex items-center justify-center transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary text-primary-text-strong font-bold shadow-2xs'
                                            : 'bg-surface-subtle text-text-secondary border border-border-default hover:bg-surface-hover hover:text-primary'
                                    }`}
                                    title={`تصفية بالحرف ${letter}`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                        {selectedLetters.length > 0 && (
                            <button
                                onClick={() => setSelectedLetters([])}
                                className="text-[10px] px-1.5 py-0.5 text-text-muted hover:text-red-500 underline cursor-pointer"
                            >
                                إلغاء
                            </button>
                        )}
                    </div>

                    {/* COMPACT SURAH CHIPS LIST: Side-by-side, with Noorani letters if present */}
                    <div className="pt-2 border-t border-border-default/60">
                        {displayedSurahs.length > 0 ? (
                            <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                                {displayedSurahs.map(surah => {
                                    const isSelected = selectedSurahIds.includes(surah.number);
                                    return (
                                        <button
                                            key={surah.number}
                                            id={`surah-chip-${surah.number}`}
                                            onClick={() => toggleSurah(surah.number)}
                                            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-medium flex items-center gap-1 ${
                                                isSelected
                                                    ? 'bg-primary text-primary-text-strong border-primary font-bold shadow-2xs scale-[1.02]'
                                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary border-border-default'
                                            }`}
                                            title={surah.rawName}
                                        >
                                            <span>{surah.cleanName}</span>
                                            {surah.muqattaat && (
                                                <span className={`font-quran text-[11px] font-bold mr-0.5 ${
                                                    isSelected
                                                        ? 'text-primary-text-strong/90'
                                                        : 'text-amber-700 dark:text-amber-300'
                                                }`}>
                                                    ({surah.muqattaat})
                                                </span>
                                            )}
                                            {isSelected && (
                                                <span className="text-[10px] bg-primary-text-strong/20 px-0.5 rounded leading-none">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs text-text-muted">
                                لا توجد سور مطابقة لبحثك.
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. SELECTED SURAHS ACTIVE CHIPS (COMPACT) */}
                {selectedSurahIds.length > 0 && (
                    <section className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 shadow-2xs space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-primary">
                                السور المفلترة ({selectedSurahIds.length}):
                            </span>
                            <button
                                onClick={() => setSelectedSurahIds([])}
                                className="text-red-500 hover:underline cursor-pointer text-xs"
                            >
                                مسح الكل
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {selectedSurahIds.map(id => {
                                const sRef = QURAN_INDEX.find(s => s.number === id);
                                const cleanName = getCleanSurahName(sRef?.name || `${id}`);
                                const muq = MUQATTAAT_SURAHS[id];
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-primary/30 text-xs text-text-primary font-medium"
                                    >
                                        <span>{cleanName}</span>
                                        {muq && (
                                            <span className="font-quran text-[11px] font-bold text-amber-700 dark:text-amber-300 mr-0.5">
                                                ({muq})
                                            </span>
                                        )}
                                        <button
                                            onClick={() => toggleSurah(id)}
                                            className="text-text-muted hover:text-red-500 rounded p-0.5 text-[10px]"
                                            title={`إزالة ${cleanName}`}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 2.5 PROGRESS BAR CARD (USER REQUEST: شريط تقدم عند اختيار سور كبيرة ليفهم المستخدم أن البرنامج يعمل ولا يتجمد) */}
                {isCalculating && selectedSurahIds.length > 0 && (
                    <section className="bg-surface border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 animate-fade-in">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-600 dark:border-t-amber-400 rounded-full animate-spin" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                                        <span>جاري تحليل السور المختارة</span>
                                    </h3>
                                    <p className="text-xs text-text-secondary line-clamp-1">
                                        {selectedSurahIds.slice(0, 5).map(id => getCleanSurahName(QURAN_INDEX.find(s => s.number === id)?.name || `${id}`)).join('، ')}
                                        {selectedSurahIds.length > 5 ? ` وغيرها (${selectedSurahIds.length} سورة)` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Percentage Badge */}
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm px-3 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                                    {progressPercent}٪
                                </span>
                            </div>
                        </div>

                        {/* The Track & Animated Fill Bar */}
                        <div className="w-full bg-surface-subtle dark:bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 border border-border-default shadow-inner">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-amber-500 via-amber-600 to-emerald-500 transition-all duration-300 ease-out shadow-xs"
                                style={{ width: `${Math.max(6, progressPercent)}%` }}
                            />
                        </div>

                        {/* Status Line */}
                        <div className="flex items-center justify-between gap-2 text-xs text-text-muted flex-wrap">
                            <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {progressStatus || 'جاري المعالجة والتحليل...'}
                            </span>
                            <span className="text-[11px] text-text-muted">
                                تتم المعالجة بسلاسة في الخلفية لتجنب تجميد المتصفح
                            </span>
                        </div>
                    </section>
                )}

                {/* 3. RESULTS SECTION (USER REQUEST: الكلمات فقط دون تكرار ودون كم سورة، والآيات بترتيب الأكثر كلمات مشتركة أولاً) */}
                {intersectionResults && selectedSurahIds.length > 0 && (
                    <section
                        id="multi-intersections-results"
                        className={`bg-surface border border-border-default rounded-2xl overflow-hidden shadow-xs animate-fade-in space-y-0 ${
                            isCalculating ? 'opacity-50 pointer-events-none transition-opacity' : ''
                        }`}
                    >
                        {/* Compact Results Header */}
                        <div className="p-3 sm:p-4 border-b border-border-default bg-surface-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-bold text-text-primary">
                                        {selectedSurahIds.length === 1
                                            ? `محتويات ${getCleanSurahName(QURAN_INDEX.find(s => s.number === selectedSurahIds[0])?.name || '')}`
                                            : `تقاطعات ${selectedSurahIds.length} سور مختارة`}
                                    </h2>
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                                        {intersectionResults.words.length} كلمة • {intersectionResults.roots.length} جذر • {intersectionResults.ayahs.length} آية
                                    </span>
                                </div>
                            </div>

                            {/* Strictness if 3+ surahs */}
                            {selectedSurahIds.length >= 3 && (
                                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-xs">
                                    <span className="text-[11px] text-text-muted px-1">التقاطع:</span>
                                    <button
                                        onClick={() => setStrictness('all')}
                                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-xs ${
                                            strictness === 'all'
                                                ? 'bg-primary text-primary-text-strong font-bold'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        ١٠٠٪ (الكل)
                                    </button>
                                    <button
                                        onClick={() => setStrictness('majority')}
                                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-xs ${
                                            strictness === 'majority'
                                                ? 'bg-primary text-primary-text-strong font-bold'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        ٧٥٪
                                    </button>
                                    <button
                                        onClick={() => setStrictness('half')}
                                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-xs ${
                                            strictness === 'half'
                                                ? 'bg-primary text-primary-text-strong font-bold'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        ٥٠٪
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-border-default bg-surface">
                            <button
                                onClick={() => setActiveTab('words')}
                                className={`flex-1 py-2.5 px-3 text-center font-bold text-xs sm:text-sm transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'words'
                                        ? 'bg-primary/5 text-primary border-primary'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span>الكلمات المتقاطعة</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-primary/10 text-primary">
                                    {displayWords.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('roots')}
                                className={`flex-1 py-2.5 px-3 text-center font-bold text-xs sm:text-sm transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'roots'
                                        ? 'bg-purple-600/5 text-purple-600 dark:text-purple-400 border-purple-600'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span>الجذور المتقاطعة</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-purple-600/10 text-purple-600 dark:text-purple-400">
                                    {displayRoots.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('ayahs')}
                                className={`flex-1 py-2.5 px-3 text-center font-bold text-xs sm:text-sm transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'ayahs'
                                        ? 'bg-amber-600/5 text-amber-600 dark:text-amber-400 border-amber-600'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span>الآيات المتقاطعة</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-600/10 text-amber-600 dark:text-amber-400">
                                    {displayAyahs.length}
                                </span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-3 sm:p-5">
                            {/* 1. WORDS TAB (USER REQUEST: الكلمات فقط دون عدد التكرار، ولا في كم سورة) */}
                            {activeTab === 'words' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="relative flex-1 max-w-sm">
                                            <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="تصفية الكلمات..."
                                                value={wordFilter}
                                                onChange={(e) => setWordFilter(e.target.value)}
                                                className="w-full text-xs bg-surface-subtle text-text-primary border border-border-default rounded-lg pr-7 pl-2 py-1.5 focus:outline-hidden focus:border-primary"
                                            />
                                        </div>

                                        <button
                                            onClick={() => copyToClipboard(displayWords.map(w => w.word).join(', '), 'words')}
                                            className="text-xs px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                            title="نسخ جميع الكلمات المتقاطعة"
                                        >
                                            {copiedTab === 'words' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            <span>{copiedTab === 'words' ? 'تم النسخ' : 'نسخ الكلمات'}</span>
                                        </button>
                                    </div>

                                    {/* COMPACT WORDS LIST: ONLY THE WORDS, NO COUNTS, NO SURAH STATS */}
                                    {displayWords.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {paginatedWords.map(({ word }) => (
                                                    <button
                                                        key={word}
                                                        onClick={() => onWordClick && onWordClick(word, false)}
                                                        className="px-2.5 py-1 text-xs sm:text-sm font-quran bg-surface-subtle hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border-default rounded-lg transition-colors cursor-pointer"
                                                        title={`بحث عن "${word}" في المصحف`}
                                                    >
                                                        {word}
                                                    </button>
                                                ))}
                                            </div>
                                            {displayWords.length > visibleWordCount && (
                                                <div className="flex items-center justify-center pt-3 gap-2">
                                                    <button
                                                        onClick={() => setVisibleWordCount(prev => prev + 120)}
                                                        className="px-4 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span>عرض المزيد من الكلمات (+120)</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/20">
                                                            متبقي {displayWords.length - visibleWordCount}
                                                        </span>
                                                    </button>
                                                    {displayWords.length - visibleWordCount > 120 && (
                                                        <button
                                                            onClick={() => setVisibleWordCount(displayWords.length)}
                                                            className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary text-xs transition-colors cursor-pointer"
                                                        >
                                                            عرض الكل ({displayWords.length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-text-muted text-xs">
                                            لا توجد كلمات متقاطعة مطابقة لبحثك.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 2. ROOTS TAB (COMPACT ROOTS: ONLY THE ROOTS) */}
                            {activeTab === 'roots' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="relative flex-1 max-w-sm">
                                            <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="تصفية الجذور..."
                                                value={rootFilter}
                                                onChange={(e) => setRootFilter(e.target.value)}
                                                className="w-full text-xs bg-surface-subtle text-text-primary border border-border-default rounded-lg pr-7 pl-2 py-1.5 focus:outline-hidden focus:border-purple-600"
                                            />
                                        </div>

                                        <button
                                            onClick={() => copyToClipboard(displayRoots.map(r => r.root).join(', '), 'roots')}
                                            className="text-xs px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                            title="نسخ جميع الجذور المشتركة"
                                        >
                                            {copiedTab === 'roots' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            <span>{copiedTab === 'roots' ? 'تم النسخ' : 'نسخ الجذور'}</span>
                                        </button>
                                    </div>

                                    {/* COMPACT ROOTS LIST: ONLY THE ROOTS */}
                                    {displayRoots.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {paginatedRoots.map(({ root }) => (
                                                    <button
                                                        key={root}
                                                        onClick={() => onWordClick && onWordClick(root, true)}
                                                        className="px-2.5 py-1 text-xs sm:text-sm font-quran font-bold bg-purple-500/5 hover:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-colors cursor-pointer"
                                                        title={`بحث عن جذر "${root}"`}
                                                    >
                                                        {root}
                                                    </button>
                                                ))}
                                            </div>
                                            {displayRoots.length > visibleRootCount && (
                                                <div className="flex items-center justify-center pt-3 gap-2">
                                                    <button
                                                        onClick={() => setVisibleRootCount(prev => prev + 100)}
                                                        className="px-4 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span>عرض المزيد من الجذور (+100)</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/20">
                                                            متبقي {displayRoots.length - visibleRootCount}
                                                        </span>
                                                    </button>
                                                    {displayRoots.length - visibleRootCount > 100 && (
                                                        <button
                                                            onClick={() => setVisibleRootCount(displayRoots.length)}
                                                            className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary text-xs transition-colors cursor-pointer"
                                                        >
                                                            عرض الكل ({displayRoots.length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-text-muted text-xs">
                                            لا توجد جذور متقاطعة مطابقة لبحثك.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. AYAHS TAB (USER REQUEST: ترتيب الأكثر كلمات مشتركة أولاً ثم الأقل اشتراكاً) */}
                            {activeTab === 'ayahs' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="تصفية الآيات المتقاطعة..."
                                                value={ayahFilter}
                                                onChange={(e) => setAyahFilter(e.target.value)}
                                                className="w-full text-xs bg-surface-subtle text-text-primary border border-border-default rounded-lg pr-7 pl-2 py-1.5 focus:outline-hidden focus:border-amber-600"
                                            />
                                        </div>

                                        {/* خيارات تصفية نوع التقاطع: الكل / بين السور / في نفس السورة */}
                                        {sameSurahAyahsCount > 0 && crossSurahAyahsCount > 0 && (
                                            <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-xs">
                                                <button
                                                    onClick={() => setAyahRepeatFilter('all')}
                                                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                                        ayahRepeatFilter === 'all'
                                                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    الكل ({intersectionResults.ayahs.length})
                                                </button>
                                                <button
                                                    onClick={() => setAyahRepeatFilter('cross')}
                                                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                                        ayahRepeatFilter === 'cross'
                                                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    بين السور ({crossSurahAyahsCount})
                                                </button>
                                                <button
                                                    onClick={() => setAyahRepeatFilter('same')}
                                                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                                        ayahRepeatFilter === 'same'
                                                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    في نفس السورة ({sameSurahAyahsCount})
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {displayAyahs.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between text-xs text-text-muted px-1">
                                                <span>
                                                    عرض {Math.min(visibleAyahCount, displayAyahs.length)} من أصل {displayAyahs.length} آية متقاطعة
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {paginatedAyahs.map(item => {
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 sm:p-4 rounded-xl bg-surface-subtle border border-border-default hover:border-amber-500/40 transition-all space-y-2.5"
                                                        >
                                                            {/* Header: Shared Words Count Tag, Same Surah Tag & Combined Noorani Letters */}
                                                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                                                                        item.matchType === 'exact'
                                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                                            : item.matchType === 'phrase'
                                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                            : 'bg-primary/10 text-primary border border-primary/20'
                                                                    }`}>
                                                                        {item.matchType === 'exact'
                                                                            ? `تطابق تام (${item.sharedWordsCount} كلمة)`
                                                                            : `تشابه (${item.sharedWordsCount} كلمات مشتركة)`}
                                                                    </span>

                                                                    {item.isSameSurahRepeat && (
                                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                                                            تكرار في نفس السورة ({item.occurrences.length > 1 ? `${item.occurrences.length} مرات` : 'موضعان'})
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Side: Noorani Letters directly next to Shared Words Count (e.g. الم2) */}
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {item.muqattaatBadges.map((m, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 font-quran font-bold text-xs border border-amber-500/30 shadow-2xs"
                                                                            title={m.count > 1 ? `${m.letters} (مكررة ${m.count} مرات)` : m.letters}
                                                                        >
                                                                            {m.label}
                                                                        </span>
                                                                    ))}

                                                                    <span className="text-text-muted text-[11px] font-medium bg-surface px-2 py-0.5 rounded-md border border-border-default/60">
                                                                        {item.sharedWordsCount} كلمة متقاطعة
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Ayah 1 */}
                                                            <div className="p-3 bg-surface rounded-lg border border-border-default/60 space-y-1.5">
                                                                <div className="flex items-center justify-between text-xs text-primary font-bold flex-wrap gap-1">
                                                                    <span>{item.occurrences[0]?.surahName} (الآية {item.occurrences[0]?.ayahNumber})</span>
                                                                    <button
                                                                        onClick={() => navigateToAyah(item.occurrences[0].surahNumber, item.occurrences[0].ayahNumber)}
                                                                        className="text-[11px] text-text-muted hover:text-primary transition-colors cursor-pointer"
                                                                    >
                                                                        عرض في السورة ↗
                                                                    </button>
                                                                </div>
                                                                <div className="font-quran text-sm sm:text-base leading-relaxed text-text-primary">
                                                                    {renderHighlightedAyah(item.text, item.sharedWords)}
                                                                </div>
                                                            </div>

                                                            {/* Pair Ayah if 2 Surahs */}
                                                            {item.pairText2 && (
                                                                <div className="p-3 bg-surface rounded-lg border border-border-default/60 space-y-1.5">
                                                                    <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold flex-wrap gap-1">
                                                                        <span>{item.pairSurah2Name} (الآية {item.pairAyah2Number})</span>
                                                                        <button
                                                                            onClick={() => navigateToAyah(item.pairSurah2Number!, item.pairAyah2Number!)}
                                                                            className="text-[11px] text-text-muted hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                                                                        >
                                                                            عرض في السورة ↗
                                                                        </button>
                                                                    </div>
                                                                    <div className="font-quran text-sm sm:text-base leading-relaxed text-text-primary">
                                                                        {renderHighlightedAyah(item.pairText2, item.sharedWords)}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Multi-Surah Occurrences (3+ Surahs) */}
                                                            {item.occurrences.length > 1 && !item.pairText2 && (
                                                                <div className="flex flex-wrap gap-1 pt-1">
                                                                    <span className="text-[11px] text-text-muted self-center ml-1">المواضع:</span>
                                                                    {item.occurrences.map((occ, i) => (
                                                                        <button
                                                                            key={i}
                                                                            onClick={() => navigateToAyah(occ.surahNumber, occ.ayahNumber)}
                                                                            className="text-xs px-2 py-0.5 rounded bg-surface border border-border-default text-text-primary hover:text-primary transition-colors cursor-pointer"
                                                                        >
                                                                            {occ.surahName} [{occ.ayahNumber}] ↗
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {displayAyahs.length > visibleAyahCount && (
                                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-2">
                                                    <button
                                                        onClick={() => setVisibleAyahCount(prev => prev + 30)}
                                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <span>عرض 30 آية إضافية</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20">
                                                            متبقي {displayAyahs.length - visibleAyahCount}
                                                        </span>
                                                    </button>
                                                    {displayAyahs.length - visibleAyahCount > 30 && (
                                                        <button
                                                            onClick={() => setVisibleAyahCount(displayAyahs.length)}
                                                            className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary text-xs transition-colors cursor-pointer"
                                                        >
                                                            عرض جميع الآيات ({displayAyahs.length})
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-text-muted text-xs">
                                            لا توجد آيات متقاطعة مطابقة لبحثك.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}
                </div>
            )}
            </main>
        </div>
    );
};

export default MuqattaatView;
