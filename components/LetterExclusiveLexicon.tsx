import React, { useState, useMemo, useCallback } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { getArabicRoot } from '../utils/roots';
import { QURAN_INDEX } from '../quranIndex';
import { MUQATTAAT_SURAHS, getCleanSurahName } from './MuqattaatView';
import { SearchIcon, ClearIcon, CopyIcon, CheckIcon } from './icons';

interface LetterExclusiveLexiconProps {
    simpleCleanData: SurahData[];
    onWordClick?: (query: string, isRoot: boolean) => void;
    navigateToAyah?: (surahNumber: number, ayahNumber: number) => void;
}

// 14 Noorani letters
const NOORANI_LETTERS = ['ا', 'ح', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'ي'];

// Popular Muqattaat formulas / combinations
const PRESET_FORMULAS = [
    { label: 'ط (طه، الطواسين)', letter: 'ط', surahs: [20, 26, 27, 28] },
    { label: 'ق (الشورى، ق)', letter: 'ق', surahs: [42, 50] },
    { label: 'ص (الأعراف، مريم، ص)', letter: 'ص', surahs: [7, 19, 38] },
    { label: 'ن (القلم)', letter: 'ن', surahs: [68] },
    { label: 'حم (الحواميم السبعة)', letter: 'حم', surahs: [40, 41, 42, 43, 44, 45, 46] },
    { label: 'الم (البقرة، آل عمران، 4 أخرى)', letter: 'الم', surahs: [2, 3, 29, 30, 31, 32] },
    { label: 'الر (يونس، هود، يوسف، إبراهيم، الحجر)', letter: 'الر', surahs: [10, 11, 12, 14, 15] },
    { label: 'كهيعص (مريم)', letter: 'كهيعص', surahs: [19] },
    { label: 'يس (يس)', letter: 'يس', surahs: [36] },
];

// Common Quranic stop words to filter out if requested
const COMMON_STOP_WORDS = new Set([
    "في", "من", "على", "إلى", "أن", "إن", "ولا", "بما", "وما", "الذي", "التي", "هم", "كانوا", "هو", "هي",
    "يا", "أيها", "ياأيها", "الذين", "لهم", "بهم", "فيهم", "عليهم", "إليهم", "ثم", "أو", "أم", "بل", "قد",
    "لقد", "فما", "كما", "فلما", "كلما", "ألم", "أفلم", "أولم", "فهل", "هل", "عن", "لو", "لولا", "لوما",
    "حتى", "لما", "إلا", "لا", "ما", "ذا", "هذا", "هذه", "ذلك", "تلك", "ذلكم", "هؤلاء", "كل", "كان", "قال",
    "قالوا", "قل", "إذا", "إذ", "فإذا", "وإذا", "وإن", "فإن", "ألا", "غير", "بين", "دون", "عند", "مع"
]);

interface WordExclusivityItem {
    rawWord: string;
    cleanWord: string;
    root: string;
    targetSurahCount: number;
    targetOccurrences: number;
    otherMuqattaatOccurrences: number;
    restQuranOccurrences: number;
    totalQuranOccurrences: number;
    isEntireQuranExclusive: boolean;
    isMuqattaatExclusive: boolean;
    concentrationRatio: number;
    surahsPresent: number[];
    sampleAyahs: Array<{
        surahNumber: number;
        surahName: string;
        ayahNumber: number;
        text: string;
    }>;
}

export const LetterExclusiveLexicon: React.FC<LetterExclusiveLexiconProps> = ({
    simpleCleanData,
    onWordClick,
    navigateToAyah
}) => {
    // Mode: 'letter' (single or combined letter selector) or 'group_intersect' (Group A vs Group B intersection)
    const [analysisMode, setAnalysisMode] = useState<'letter' | 'group_intersect'>('letter');

    // Selected letter or formula
    const [selectedLetter, setSelectedLetter] = useState<string>('ط');

    // Group intersection state (Group A & Group B surahs)
    const [groupASurahs, setGroupASurahs] = useState<number[]>([26, 27, 28]); // الطواسين
    const [groupBSurahs, setGroupBSurahs] = useState<number[]>([20, 27]); // طه والنمل

    // Filter Controls
    const [exclusivityLevel, setExclusivityLevel] = useState<'all_quran' | 'muqattaat' | 'high_concentration'>('muqattaat');
    const [filterStopWords, setFilterStopWords] = useState<boolean>(true);
    const [minOccurrences, setMinOccurrences] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [resultTypeTab, setResultTypeTab] = useState<'words' | 'roots'>('words');

    // Expanded word for viewing sample Ayahs
    const [expandedWord, setExpandedWord] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    // Helper: Clean a word for grouping
    const cleanWordFn = useCallback((word: string): string => {
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

    // 1. Pre-index the entire Quran's words into a quick lookup structure (runs once)
    const quranWordIndex = useMemo(() => {
        const index = new Map<string, {
            cleanForm: string;
            root: string;
            surahCounts: Map<number, number>;
            totalCount: number;
            sampleAyahs: Array<{
                surahNumber: number;
                surahName: string;
                ayahNumber: number;
                text: string;
            }>;
        }>();

        simpleCleanData.forEach(surah => {
            const sNum = surah.number;
            const sName = getCleanSurahName(surah.name);

            surah.ayahs.forEach(ayah => {
                if (!ayah.text) return;
                const words = ayah.text.split(/\s+/);

                words.forEach(rawW => {
                    const normW = normalizeArabicText(rawW).replace(/[^\u0621-\u064A]/g, '');
                    if (!normW || normW.length < 2) return;

                    let entry = index.get(normW);
                    if (!entry) {
                        const cleanForm = cleanWordFn(normW) || normW;
                        const root = getArabicRoot(normW) || '';
                        entry = {
                            cleanForm,
                            root,
                            surahCounts: new Map<number, number>(),
                            totalCount: 0,
                            sampleAyahs: []
                        };
                        index.set(normW, entry);
                    }

                    entry.totalCount++;
                    entry.surahCounts.set(sNum, (entry.surahCounts.get(sNum) || 0) + 1);

                    // Keep a few sample Ayahs for instant preview
                    if (entry.sampleAyahs.length < 15) {
                        entry.sampleAyahs.push({
                            surahNumber: sNum,
                            surahName: sName,
                            ayahNumber: ayah.numberInSurah,
                            text: ayah.text
                        });
                    }
                });
            });
        });

        return index;
    }, [simpleCleanData, cleanWordFn]);

    // 2. Identify the target surahs based on the mode
    const { targetSurahIds, derivedLetters, calculationLabel } = useMemo(() => {
        if (analysisMode === 'letter') {
            // Find all surahs containing the selected letter
            const normSelected = normalizeArabicText(selectedLetter);
            const matchingIds: number[] = [];

            Object.entries(MUQATTAAT_SURAHS).forEach(([sIdStr, letters]) => {
                const sId = Number(sIdStr);
                const normLetters = normalizeArabicText(letters);
                // If it's a single letter, check if letter exists in opening
                if (normSelected.length === 1) {
                    if (normLetters.includes(normSelected)) {
                        matchingIds.push(sId);
                    }
                } else {
                    // Exact formula match or contains formula
                    if (normLetters.includes(normSelected) || normSelected.includes(normLetters)) {
                        matchingIds.push(sId);
                    }
                }
            });

            return {
                targetSurahIds: matchingIds,
                derivedLetters: [selectedLetter],
                calculationLabel: `سور الحرف (${selectedLetter}): ${matchingIds.length} سورة`
            };
        } else {
            // Group intersection mode (Group A vs Group B)
            // Letters in Group A
            const lettersA = new Set<string>();
            groupASurahs.forEach(sId => {
                const l = MUQATTAAT_SURAHS[sId];
                if (l) {
                    for (const char of l) lettersA.add(char);
                }
            });

            // Letters in Group B
            const lettersB = new Set<string>();
            groupBSurahs.forEach(sId => {
                const l = MUQATTAAT_SURAHS[sId];
                if (l) {
                    for (const char of l) lettersB.add(char);
                }
            });

            // Common letters intersection
            const commonLetters = Array.from(lettersA).filter(c => lettersB.has(c));

            // Combined surahs from both groups
            const unionSurahs = Array.from(new Set([...groupASurahs, ...groupBSurahs]));

            return {
                targetSurahIds: unionSurahs,
                derivedLetters: commonLetters,
                calculationLabel: `تقاطع الحروف: [ ${commonLetters.join(' ، ') || 'لا يوجد تقاطع'} ]`
            };
        }
    }, [analysisMode, selectedLetter, groupASurahs, groupBSurahs]);

    // 3. Compute the Exclusive Words and Roots
    const { exclusiveWords, exclusiveRoots, totalEntireQuranExclusiveCount } = useMemo(() => {
        if (targetSurahIds.length === 0) {
            return { exclusiveWords: [], exclusiveRoots: [], totalEntireQuranExclusiveCount: 0 };
        }

        const targetSet = new Set(targetSurahIds);
        const muqattaatSurahIds = new Set(Object.keys(MUQATTAAT_SURAHS).map(Number));

        const wordsMap = new Map<string, WordExclusivityItem>();
        const rootsMap = new Map<string, {
            root: string;
            targetOccurrences: number;
            totalQuranOccurrences: number;
            isEntireQuranExclusive: boolean;
            isMuqattaatExclusive: boolean;
            surahsPresent: Set<number>;
            words: Set<string>;
        }>();

        let entireQuranExclusiveCounter = 0;

        // Iterate through all indexed words
        quranWordIndex.forEach((data, rawWord) => {
            // Check if this word appears in any of the target surahs
            let inTarget = false;
            let targetOccurrences = 0;
            const surahsPresent: number[] = [];

            targetSet.forEach(sId => {
                const count = data.surahCounts.get(sId) || 0;
                if (count > 0) {
                    inTarget = true;
                    targetOccurrences += count;
                    surahsPresent.push(sId);
                }
            });

            if (!inTarget) return;

            // Check if it appears in any OTHER Muqattaat surahs
            let otherMuqattaatOccurrences = 0;
            let restQuranOccurrences = 0;

            data.surahCounts.forEach((count, sId) => {
                if (targetSet.has(sId)) return;
                if (muqattaatSurahIds.has(sId)) {
                    otherMuqattaatOccurrences += count;
                } else {
                    restQuranOccurrences += count;
                }
            });

            const totalQuranOccurrences = data.totalCount;
            const isEntireQuranExclusive = otherMuqattaatOccurrences === 0 && restQuranOccurrences === 0;
            const isMuqattaatExclusive = otherMuqattaatOccurrences === 0;
            const concentrationRatio = targetOccurrences / totalQuranOccurrences;

            if (isEntireQuranExclusive) {
                entireQuranExclusiveCounter++;
            }

            // Target sample ayahs
            const targetSampleAyahs = data.sampleAyahs.filter(a => targetSet.has(a.surahNumber));

            const item: WordExclusivityItem = {
                rawWord,
                cleanWord: data.cleanForm,
                root: data.root,
                targetSurahCount: surahsPresent.length,
                targetOccurrences,
                otherMuqattaatOccurrences,
                restQuranOccurrences,
                totalQuranOccurrences,
                isEntireQuranExclusive,
                isMuqattaatExclusive,
                concentrationRatio,
                surahsPresent,
                sampleAyahs: targetSampleAyahs
            };

            wordsMap.set(rawWord, item);

            // Accumulate roots
            if (data.root) {
                let rEntry = rootsMap.get(data.root);
                if (!rEntry) {
                    rEntry = {
                        root: data.root,
                        targetOccurrences: 0,
                        totalQuranOccurrences: 0,
                        isEntireQuranExclusive: true,
                        isMuqattaatExclusive: true,
                        surahsPresent: new Set<number>(),
                        words: new Set<string>()
                    };
                    rootsMap.set(data.root, rEntry);
                }

                rEntry.targetOccurrences += targetOccurrences;
                rEntry.totalQuranOccurrences += totalQuranOccurrences;
                rEntry.words.add(rawWord);
                surahsPresent.forEach(s => rEntry!.surahsPresent.add(s));

                if (!isEntireQuranExclusive) {
                    rEntry.isEntireQuranExclusive = false;
                }
                if (!isMuqattaatExclusive) {
                    rEntry.isMuqattaatExclusive = false;
                }
            }
        });

        // Convert and filter words
        let wordList = Array.from(wordsMap.values());

        // Stop words filter
        if (filterStopWords) {
            wordList = wordList.filter(w => !COMMON_STOP_WORDS.has(w.rawWord) && !COMMON_STOP_WORDS.has(w.cleanWord));
        }

        // Min occurrences filter
        if (minOccurrences > 1) {
            wordList = wordList.filter(w => w.targetOccurrences >= minOccurrences);
        }

        // Exclusivity Level Filter
        if (exclusivityLevel === 'all_quran') {
            wordList = wordList.filter(w => w.isEntireQuranExclusive);
        } else if (exclusivityLevel === 'muqattaat') {
            wordList = wordList.filter(w => w.isMuqattaatExclusive);
        } else if (exclusivityLevel === 'high_concentration') {
            wordList = wordList.filter(w => w.concentrationRatio >= 0.6);
        }

        // Search Query
        if (searchQuery.trim()) {
            const q = normalizeArabicText(searchQuery.trim());
            wordList = wordList.filter(w =>
                normalizeArabicText(w.rawWord).includes(q) ||
                (w.root && normalizeArabicText(w.root).includes(q))
            );
        }

        // Sort: Entire Quran exclusive first, then by concentration ratio, then by occurrences
        wordList.sort((a, b) => {
            if (a.isEntireQuranExclusive && !b.isEntireQuranExclusive) return -1;
            if (!a.isEntireQuranExclusive && b.isEntireQuranExclusive) return 1;
            if (b.concentrationRatio !== a.concentrationRatio) {
                return b.concentrationRatio - a.concentrationRatio;
            }
            return b.targetOccurrences - a.targetOccurrences;
        });

        // Convert and filter roots
        let rootList = Array.from(rootsMap.values()).map(r => ({
            root: r.root,
            targetOccurrences: r.targetOccurrences,
            totalQuranOccurrences: r.totalQuranOccurrences,
            isEntireQuranExclusive: r.isEntireQuranExclusive,
            isMuqattaatExclusive: r.isMuqattaatExclusive,
            concentrationRatio: r.targetOccurrences / r.totalQuranOccurrences,
            surahsCount: r.surahsPresent.size,
            wordsCount: r.words.size,
            wordsList: Array.from(r.words)
        }));

        if (exclusivityLevel === 'all_quran') {
            rootList = rootList.filter(r => r.isEntireQuranExclusive);
        } else if (exclusivityLevel === 'muqattaat') {
            rootList = rootList.filter(r => r.isMuqattaatExclusive);
        } else if (exclusivityLevel === 'high_concentration') {
            rootList = rootList.filter(r => r.concentrationRatio >= 0.6);
        }

        if (searchQuery.trim()) {
            const q = normalizeArabicText(searchQuery.trim());
            rootList = rootList.filter(r => normalizeArabicText(r.root).includes(q));
        }

        rootList.sort((a, b) => {
            if (a.isEntireQuranExclusive && !b.isEntireQuranExclusive) return -1;
            if (!a.isEntireQuranExclusive && b.isEntireQuranExclusive) return 1;
            return b.targetOccurrences - a.targetOccurrences;
        });

        return {
            exclusiveWords: wordList,
            exclusiveRoots: rootList,
            totalEntireQuranExclusiveCount: entireQuranExclusiveCounter
        };
    }, [
        targetSurahIds,
        quranWordIndex,
        filterStopWords,
        minOccurrences,
        exclusivityLevel,
        searchQuery
    ]);

    // Copy words to clipboard
    const handleCopyList = () => {
        const textToCopy = resultTypeTab === 'words'
            ? exclusiveWords.map(w => `${w.rawWord} (${w.targetOccurrences} مرات)`).join('، ')
            : exclusiveRoots.map(r => `${r.root} (${r.targetOccurrences} مرات)`).join('، ');

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Toggle surah in Group A
    const toggleGroupASurah = (id: number) => {
        setGroupASurahs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Toggle surah in Group B
    const toggleGroupBSurah = (id: number) => {
        setGroupBSurahs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleNavigate = (surahNum: number, ayahNum: number) => {
        if (navigateToAyah) {
            navigateToAyah(surahNum, ayahNum);
        } else {
            window.location.hash = `#/surah/${surahNum}?ayah=${ayahNum}`;
        }
    };

    return (
        <div className="space-y-4" dir="rtl">
            {/* Top Concept Header */}
            <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-2xs">
                            <span className="font-quran text-amber-700 dark:text-amber-300 font-bold text-base">طس</span>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-text-primary leading-tight">
                                المعجم الخالص للحروف النورانية (البصمة المعجمية)
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                                استخراج الكلمات المنفردة بكل حرف واستبعاد المشترك العام وباقي سور الحروف
                            </p>
                        </div>
                    </div>

                    {/* Mode Switcher: Letter vs Group Intersection */}
                    <div className="flex items-center bg-surface-subtle border border-border-default p-1 rounded-xl text-xs">
                        <button
                            onClick={() => setAnalysisMode('letter')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                                analysisMode === 'letter'
                                    ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 shadow-2xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            تحديد الحرف مباشرة
                        </button>
                        <button
                            onClick={() => setAnalysisMode('group_intersect')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                                analysisMode === 'group_intersect'
                                    ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 shadow-2xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            تقاطع المجموعات (طس × طسم)
                        </button>
                    </div>
                </div>

                {/* MODE 1: Direct Letter Selection */}
                {analysisMode === 'letter' && (
                    <div className="space-y-3 pt-2 border-t border-border-default/60">
                        {/* 14 Noorani Letters Badges */}
                        <div>
                            <div className="text-xs font-bold text-text-secondary mb-1.5">اختر حرفاً نورانياً:</div>
                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                {NOORANI_LETTERS.map(letter => {
                                    const isSelected = selectedLetter === letter;
                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => setSelectedLetter(letter)}
                                            className={`min-w-[34px] px-2.5 py-1 text-sm font-quran font-bold rounded-lg transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-amber-500 text-primary-text-strong shadow-xs scale-105'
                                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default'
                                            }`}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Preset Multi-letter formulas */}
                        <div>
                            <div className="text-xs font-bold text-text-secondary mb-1.5">أو اختر فصيلة من سور الحروف:</div>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_FORMULAS.map(p => {
                                    const isSelected = selectedLetter === p.letter;
                                    return (
                                        <button
                                            key={p.label}
                                            onClick={() => setSelectedLetter(p.letter)}
                                            className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-primary text-primary-text-strong font-bold'
                                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE 2: Multi-Group Intersection (e.g. طس + طسم vs طس + طه) */}
                {analysisMode === 'group_intersect' && (
                    <div className="space-y-3 pt-2 border-t border-border-default/60">
                        <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-2.5">
                            <div className="text-xs font-bold text-text-primary">
                                تجربة تقاطع المجموعتين لاستخراج الحرف المشترك تلقائياً:
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Group A */}
                                <div className="p-2.5 bg-surface rounded-lg border border-border-default space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                                        <span>المجموعة (أ) - اختر السور:</span>
                                        <span>
                                            الحروف: {Array.from(new Set(groupASurahs.map(id => MUQATTAAT_SURAHS[id] || '').join(''))).join('، ') || 'فارغ'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                                        {Object.entries(MUQATTAAT_SURAHS).map(([idStr, letters]) => {
                                            const sId = Number(idStr);
                                            const sRef = QURAN_INDEX.find(s => s.number === sId);
                                            const isSelected = groupASurahs.includes(sId);
                                            return (
                                                <button
                                                    key={sId}
                                                    onClick={() => toggleGroupASurah(sId)}
                                                    className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white font-bold'
                                                            : 'bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-default/60'
                                                    }`}
                                                >
                                                    {getCleanSurahName(sRef?.name || '')} ({letters})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Group B */}
                                <div className="p-2.5 bg-surface rounded-lg border border-border-default space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                                        <span>المجموعة (ب) - اختر السور:</span>
                                        <span>
                                            الحروف: {Array.from(new Set(groupBSurahs.map(id => MUQATTAAT_SURAHS[id] || '').join(''))).join('، ') || 'فارغ'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                                        {Object.entries(MUQATTAAT_SURAHS).map(([idStr, letters]) => {
                                            const sId = Number(idStr);
                                            const sRef = QURAN_INDEX.find(s => s.number === sId);
                                            const isSelected = groupBSurahs.includes(sId);
                                            return (
                                                <button
                                                    key={sId}
                                                    onClick={() => toggleGroupBSurah(sId)}
                                                    className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white font-bold'
                                                            : 'bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-default/60'
                                                    }`}
                                                >
                                                    {getCleanSurahName(sRef?.name || '')} ({letters})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Resulting intersection of letters banner */}
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-amber-800 dark:text-amber-200">الحرف المشترك الناتج:</span>
                                    {derivedLetters.length > 0 ? (
                                        <div className="flex gap-1">
                                            {derivedLetters.map(char => (
                                                <span key={char} className="px-2 py-0.5 bg-amber-500 text-primary-text-strong font-quran font-bold rounded">
                                                    {char}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-text-muted">لا يوجد حرف مشترك بين المجموعتين</span>
                                    )}
                                </div>
                                <span className="text-text-secondary text-[11px]">
                                    يتم الآن استخراج الكلمات المشتركة والخالصة لهذا التقاطع أدناه
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Target Surahs Info Banner */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-surface-subtle p-2.5 rounded-xl border border-border-default/70">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-text-primary">{calculationLabel}</span>
                        <div className="flex items-center gap-1 flex-wrap mr-1">
                            {targetSurahIds.map(id => {
                                const sRef = QURAN_INDEX.find(s => s.number === id);
                                const muq = MUQATTAAT_SURAHS[id];
                                return (
                                    <span key={id} className="px-1.5 py-0.5 bg-surface text-text-secondary rounded border border-border-default/80 text-[11px]">
                                        {getCleanSurahName(sRef?.name || '')} {muq ? `(${muq})` : ''}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            {totalEntireQuranExclusiveCount} كلمة منفردة في كامل القرآن
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter & Exclusivity Control Panel */}
            <div className="bg-surface border border-border-default rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    {/* Exclusivity Scope Tabs */}
                    <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default text-xs flex-wrap">
                        <button
                            onClick={() => setExclusivityLevel('muqattaat')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                                exclusivityLevel === 'muqattaat'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            خالص بين سور الحروف (مستبعد من الـ 29)
                        </button>
                        <button
                            onClick={() => setExclusivityLevel('all_quran')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                                exclusivityLevel === 'all_quran'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            انفراد تام في كامل القرآن (100%)
                        </button>
                        <button
                            onClick={() => setExclusivityLevel('high_concentration')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                                exclusivityLevel === 'high_concentration'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            تمركز عالي (&gt;60%)
                        </button>
                    </div>

                    {/* Result type: Words vs Roots */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-border-default text-xs">
                            <button
                                onClick={() => setResultTypeTab('words')}
                                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                                    resultTypeTab === 'words'
                                        ? 'bg-primary text-primary-text-strong'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                الكلمات ({exclusiveWords.length})
                            </button>
                            <button
                                onClick={() => setResultTypeTab('roots')}
                                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                                    resultTypeTab === 'roots'
                                        ? 'bg-primary text-primary-text-strong'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                الجذور ({exclusiveRoots.length})
                            </button>
                        </div>

                        <button
                            onClick={handleCopyList}
                            className="text-xs px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="نسخ القائمة"
                        >
                            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                    </div>
                </div>

                {/* Sub-filters row */}
                <div className="flex items-center justify-between gap-2.5 flex-wrap pt-2 border-t border-border-default/60 text-xs">
                    {/* Search inside results */}
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="بحث في النتائج..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs bg-surface-subtle text-text-primary border border-border-default rounded-lg pr-7 pl-2 py-1 focus:outline-hidden focus:border-amber-600"
                        />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Stopwords filter toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary select-none">
                            <input
                                type="checkbox"
                                checked={filterStopWords}
                                onChange={(e) => setFilterStopWords(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span>استبعاد الكلمات العامة والأدوات (في، من، قال...)</span>
                        </label>

                        {/* Minimum occurrences dropdown */}
                        <div className="flex items-center gap-1 text-text-secondary">
                            <span>التكرار الأدنى:</span>
                            <select
                                value={minOccurrences}
                                onChange={(e) => setMinOccurrences(Number(e.target.value))}
                                className="bg-surface-subtle border border-border-default rounded px-2 py-0.5 text-xs text-text-primary focus:outline-hidden"
                            >
                                <option value={1}>مرة واحدة (الكل)</option>
                                <option value={2}>مرتان فأكثر (2+)</option>
                                <option value={3}>3 مرات فأكثر (3+)</option>
                                <option value={5}>5 مرات فأكثر (5+)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {resultTypeTab === 'words' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-text-muted px-1">
                        <span>
                            عُثر على <strong className="text-text-primary font-bold">{exclusiveWords.length}</strong> كلمة تطابق شرط الخلوص للحرف.
                        </span>
                        <span>اضغط على أي كلمة لعرض الآيات التي وردت فيها</span>
                    </div>

                    {exclusiveWords.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {exclusiveWords.map(item => {
                                const isExpanded = expandedWord === item.rawWord;
                                return (
                                    <div
                                        key={item.rawWord}
                                        className={`rounded-xl border transition-all ${
                                            isExpanded
                                                ? 'col-span-1 sm:col-span-2 lg:col-span-3 bg-surface border-amber-500 shadow-sm p-4'
                                                : 'bg-surface-subtle hover:bg-surface border-border-default hover:border-amber-500/40 p-3'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div
                                                onClick={() => setExpandedWord(isExpanded ? null : item.rawWord)}
                                                className="cursor-pointer flex-1"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-quran text-base sm:text-lg font-bold text-text-primary hover:text-amber-600 transition-colors">
                                                        {item.rawWord}
                                                    </span>
                                                    {item.root && (
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-quran">
                                                            {item.root}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px]">
                                                    <span className="font-bold text-amber-700 dark:text-amber-300">
                                                        تكرار: {item.targetOccurrences}
                                                    </span>
                                                    <span className="text-text-muted">|</span>
                                                    <span>في {item.targetSurahCount} سُوَر</span>
                                                    {item.isEntireQuranExclusive ? (
                                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                                                            انفراد تام بالمصحف
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium">
                                                            خالصة لسور الحرف
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {onWordClick && (
                                                    <button
                                                        onClick={() => onWordClick(item.rawWord, false)}
                                                        className="px-2 py-1 text-[11px] rounded bg-surface hover:bg-primary/10 text-text-secondary hover:text-primary border border-border-default transition-colors cursor-pointer"
                                                        title="بحث في المصحف"
                                                    >
                                                        بحث ↗
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpandedWord(isExpanded ? null : item.rawWord)}
                                                    className="px-2 py-1 text-[11px] rounded bg-surface text-text-secondary hover:text-text-primary border border-border-default transition-colors cursor-pointer"
                                                >
                                                    {isExpanded ? 'إغلاق' : 'الآيات ▾'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Sample Ayahs View */}
                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-border-default/60 space-y-2">
                                                <div className="text-xs font-bold text-text-secondary flex items-center justify-between">
                                                    <span>مواضع ورود كلمة ({item.rawWord}) في سور هذا الحرف:</span>
                                                    <span className="text-[11px] text-text-muted">
                                                        معروض {item.sampleAyahs.length} موضع
                                                    </span>
                                                </div>

                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                    {item.sampleAyahs.map((ayah, aIdx) => (
                                                        <div
                                                            key={aIdx}
                                                            className="p-2.5 rounded-lg bg-surface-subtle border border-border-default/80 space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between text-xs text-primary font-bold">
                                                                <span>{ayah.surahName} (الآية {ayah.ayahNumber})</span>
                                                                <button
                                                                    onClick={() => handleNavigate(ayah.surahNumber, ayah.ayahNumber)}
                                                                    className="text-[11px] text-text-muted hover:text-primary transition-colors cursor-pointer"
                                                                >
                                                                    عرض في السورة ↗
                                                                </button>
                                                            </div>
                                                            <div className="font-quran text-sm leading-relaxed text-text-primary">
                                                                {ayah.text.split(/(\s+)/).map((part, pIdx) => {
                                                                    const normPart = normalizeArabicText(part).replace(/[^\u0621-\u064A]/g, '');
                                                                    const isMatch = normPart === normalizeArabicText(item.rawWord).replace(/[^\u0621-\u064A]/g, '');
                                                                    return isMatch ? (
                                                                        <span key={pIdx} className="bg-amber-500/25 text-amber-900 dark:text-amber-200 font-bold px-1 rounded">
                                                                            {part}
                                                                        </span>
                                                                    ) : (
                                                                        <span key={pIdx}>{part}</span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-surface rounded-2xl border border-border-default text-text-muted text-xs space-y-1">
                            <div>لا توجد كلمات مطابقة للشروط المحددة حالياً.</div>
                            <div className="text-[11px]">جرب تخفيف شرط التكرار أو إلغاء تصفية الكلمات العامة.</div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Section: Roots */}
            {resultTypeTab === 'roots' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-text-muted px-1">
                        <span>
                            عُثر على <strong className="text-text-primary font-bold">{exclusiveRoots.length}</strong> جذر لغوي خالص لسور الحرف.
                        </span>
                    </div>

                    {exclusiveRoots.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {exclusiveRoots.map(item => (
                                <div
                                    key={item.root}
                                    className="p-3 rounded-xl bg-surface-subtle hover:bg-surface border border-border-default hover:border-purple-500/40 transition-all space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-quran text-base font-bold text-purple-800 dark:text-purple-300">
                                                {item.root}
                                            </span>
                                            {item.isEntireQuranExclusive ? (
                                                <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                                                    انفراد تام
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.2 text-[10px] rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 font-medium">
                                                    خالص لسور الحرف
                                                </span>
                                            )}
                                        </div>

                                        {onWordClick && (
                                            <button
                                                onClick={() => onWordClick(item.root, true)}
                                                className="px-2 py-0.5 text-xs rounded bg-surface hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-border-default transition-colors cursor-pointer"
                                                title="بحث عن الجذر"
                                            >
                                                بحث بالجذر ↗
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <span>تكرار الجذر: <strong>{item.targetOccurrences}</strong></span>
                                        <span>•</span>
                                        <span>مشتقات: <strong>{item.wordsCount}</strong> كلمات</span>
                                        <span>•</span>
                                        <span>في {item.surahsCount} سُوَر</span>
                                    </div>

                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border-default/60">
                                        {item.wordsList.slice(0, 6).map(w => (
                                            <span key={w} className="px-1.5 py-0.5 text-[11px] font-quran bg-surface rounded border border-border-default/80 text-text-primary">
                                                {w}
                                            </span>
                                        ))}
                                        {item.wordsList.length > 6 && (
                                            <span className="text-[10px] text-text-muted self-center">
                                                +{item.wordsList.length - 6} أخرى
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-surface rounded-2xl border border-border-default text-text-muted text-xs">
                            لا توجد جذور لغوية مطابقة للشروط المحددة.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
