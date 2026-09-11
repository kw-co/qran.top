import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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

// Quranic Cup Equations (طرح الأوعية واستنباط الحروف المقابلة)
export interface CupEquation {
    id: string;
    title: string;
    formulaDisplay: string;
    deducedLetter: string;
    vesselASurahs: number[];
    vesselBSurahs: number[];
    vesselAName: string;
    vesselBName: string;
    description: string;
}

const PRESET_CUP_EQUATIONS: CupEquation[] = [
    {
        id: 'tsm_minus_ts',
        title: 'طسم − طس = استنباط الميم الصافي',
        formulaDisplay: '[ طسم ] − [ طس ] = م',
        deducedLetter: 'م',
        vesselASurahs: [26, 28], // الشعراء والقصص
        vesselBSurahs: [27],     // النمل
        vesselAName: 'الشعراء والقصص (طسم)',
        vesselBName: 'النمل (طس)',
        description: 'سكب وعاء (طس: النمل) من وعاء (طسم: الشعراء والقصص) لحذف المشترك واستنباط أثر الميم الذي دخل وميز السورتين.'
    },
    {
        id: 'almr_minus_alr',
        title: 'المر − الر = استنباط الميم الصافي',
        formulaDisplay: '[ المر ] − [ الر ] = م',
        deducedLetter: 'م',
        vesselASurahs: [13],                      // الرعد
        vesselBSurahs: [10, 11, 12, 14, 15],      // سور الر الخمس
        vesselAName: 'الرعد (المر)',
        vesselBName: 'يونس، هود، يوسف، إبراهيم، الحجر (الر)',
        description: 'سكب وعاء سور (الر) من وعاء (المر: الرعد) لحذف المشترك وعزل الكلمات التي اختص بها الميم عند اقترانه بالر.'
    },
    {
        id: 'almr_minus_alm',
        title: 'المر − الم = استنباط الراء الصافي',
        formulaDisplay: '[ المر ] − [ الم ] = ر',
        deducedLetter: 'ر',
        vesselASurahs: [13],                      // الرعد
        vesselBSurahs: [2, 3, 29, 30, 31, 32],    // سور الم الست
        vesselAName: 'الرعد (المر)',
        vesselBName: 'البقرة، آل عمران، العنكبوت، الروم، لقمان، السجدة (الم)',
        description: 'سكب وعاء سور (الم) من وعاء (المر: الرعد) لحذف المشترك واستنباط أثر الراء الصافي.'
    },
    {
        id: 'alms_minus_alm',
        title: 'المص − الم = استنباط الصاد الصافي',
        formulaDisplay: '[ المص ] − [ الم ] = ص',
        deducedLetter: 'ص',
        vesselASurahs: [7],                       // الأعراف
        vesselBSurahs: [2, 3, 29, 30, 31, 32],    // سور الم
        vesselAName: 'الأعراف (المص)',
        vesselBName: 'سور الم الستة (الم)',
        description: 'سكب وعاء سور (الم) من وعاء (المص: الأعراف) لحذف المشترك واستنباط الكلمات التي ميزها حرف الصاد.'
    },
    {
        id: 'hm_asq_minus_hm',
        title: 'حمعسق − حم = استنباط (عسق)',
        formulaDisplay: '[ حمعسق ] − [ حم ] = عسق',
        deducedLetter: 'عسق',
        vesselASurahs: [42],                      // الشورى
        vesselBSurahs: [40, 41, 43, 44, 45, 46],  // الحواميم الستة
        vesselAName: 'الشورى (حمعسق)',
        vesselBName: 'الحواميم الستة الأخرى (حم)',
        description: 'سكب أوعية الحواميم من وعاء الشورى لعزل الكلمات التي انفردت بها الشورى بدخول أحرف (ع-س-ق).'
    },
    {
        id: 'alm_minus_alr',
        title: 'الم − الر = الفارق بين الميم والراء',
        formulaDisplay: '[ الم ] − [ الر ] = م (مقابل ر)',
        deducedLetter: 'م',
        vesselASurahs: [2, 3, 29, 30, 31, 32],
        vesselBSurahs: [10, 11, 12, 14, 15],
        vesselAName: 'سور الم الستة',
        vesselBName: 'سور الر الخمسة',
        description: 'حذف المشترك بين سور الم وسور الر لاستنباط الكلمات التي اختص بها وعاء الميم ولم ترد في وعاء الراء.'
    }
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
    isCupSubtractedPure: boolean;
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
    // Mode: 'letter' (single letter selector) | 'cup_equations' (مكيال الأكواب - الاستنباط الجبري) | 'group_intersect' (تقاطع المجموعات)
    const [analysisMode, setAnalysisMode] = useState<'letter' | 'cup_equations' | 'group_intersect'>('letter');

    // Selected letter or formula in 'letter' mode
    const [selectedLetter, setSelectedLetter] = useState<string>('م');

    // Cup Deduction in 'letter' mode: زر حذف المفردات المشتركة وطرح الأوعية المقابلة
    const [cupDeductionActive, setCupDeductionActive] = useState<boolean>(true);
    const [cupDeductionDepth, setCupDeductionDepth] = useState<'counterparts_and_others' | 'counterparts_only'>('counterparts_and_others');

    // Selected Cup Equation in 'cup_equations' mode
    const [selectedCupEqId, setSelectedCupEqId] = useState<string>('tsm_minus_ts');
    const [customVesselA, setCustomVesselA] = useState<number[]>([26, 28]);
    const [customVesselB, setCustomVesselB] = useState<number[]>([27]);

    // Group intersection state (Group A & Group B surahs)
    const [groupASurahs, setGroupASurahs] = useState<number[]>([26, 27, 28]); // الطواسين
    const [groupBSurahs, setGroupBSurahs] = useState<number[]>([20, 27]);     // طه والنمل

    // Filter Controls
    const [exclusivityLevel, setExclusivityLevel] = useState<'all_quran' | 'muqattaat' | 'high_concentration'>('muqattaat');
    const [filterStopWords, setFilterStopWords] = useState<boolean>(true);
    const [minOccurrences, setMinOccurrences] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [resultTypeTab, setResultTypeTab] = useState<'words' | 'roots'>('words');

    // Asynchronous Progress State (بروغرس بار دائماً لمنع تجميد المتصفح)
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressStatus, setProgressStatus] = useState<string>('');

    // Calculated Results State
    const [exclusiveWords, setExclusiveWords] = useState<WordExclusivityItem[]>([]);
    const [exclusiveRoots, setExclusiveRoots] = useState<Array<{
        root: string;
        targetOccurrences: number;
        totalQuranOccurrences: number;
        isEntireQuranExclusive: boolean;
        isMuqattaatExclusive: boolean;
        concentrationRatio: number;
        surahsCount: number;
        wordsCount: number;
        wordsList: string[];
    }>>([]);
    const [totalEntireQuranExclusiveCount, setTotalEntireQuranExclusiveCount] = useState<number>(0);
    const [calculationMeta, setCalculationMeta] = useState<{
        targetSurahs: number[];
        subtractedSurahs: number[];
        derivedLetters: string[];
        label: string;
        eliminatedCount: number;
    }>({
        targetSurahs: [],
        subtractedSurahs: [],
        derivedLetters: [],
        label: '',
        eliminatedCount: 0
    });

    // Expanded word for viewing sample Ayahs
    const [expandedWord, setExpandedWord] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

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

    // 1. Pre-index the entire Quran's words into a quick lookup structure
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

        if (!simpleCleanData || simpleCleanData.length === 0) return index;

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

    // Track active async execution to cancel previous runs on input change
    const executionIdRef = useRef<number>(0);

    // 2. Asynchronous Chunked Execution with Guaranteed Progress Bar (Never Freezes UI)
    useEffect(() => {
        const currentExecutionId = ++executionIdRef.current;
        let isCancelled = false;

        const executeAnalysisAsync = async () => {
            if (!quranWordIndex || quranWordIndex.size === 0) return;

            setIsCalculating(true);
            setProgressPercent(10);
            setProgressStatus('تهيئة أوعية الحساب القرآنية...');
            await new Promise(resolve => setTimeout(resolve, 30));
            if (isCancelled || currentExecutionId !== executionIdRef.current) return;

            // Step A: Determine Target Surahs, Subtracted Surahs, and Formula Labels
            let targetSurahIds: number[] = [];
            let subtractedSurahIds: number[] = [];
            let derivedLetters: string[] = [];
            let calculationLabel = '';

            const muqattaatSurahIds = new Set(Object.keys(MUQATTAAT_SURAHS).map(Number));

            if (analysisMode === 'cup_equations') {
                // Mode: مكيال الأكواب - معادلات الطرح الجبري
                if (selectedCupEqId === 'custom') {
                    targetSurahIds = customVesselA;
                    subtractedSurahIds = customVesselB;
                    derivedLetters = ['مخصص'];
                    calculationLabel = `مكيال مخصص: [وعاء أ: ${customVesselA.length} سور] − [وعاء ب: ${customVesselB.length} سور]`;
                } else {
                    const eq = PRESET_CUP_EQUATIONS.find(e => e.id === selectedCupEqId) || PRESET_CUP_EQUATIONS[0];
                    targetSurahIds = eq.vesselASurahs;
                    subtractedSurahIds = eq.vesselBSurahs;
                    derivedLetters = [eq.deducedLetter];
                    calculationLabel = `${eq.formulaDisplay} (${eq.title})`;
                }
            } else if (analysisMode === 'letter') {
                // Mode: تحديد الحرف مباشرة مع تفعيل مكيال الأكواب
                const normSelected = normalizeArabicText(selectedLetter);
                const matchingIds: number[] = [];

                Object.entries(MUQATTAAT_SURAHS).forEach(([sIdStr, letters]) => {
                    const sId = Number(sIdStr);
                    const normLetters = normalizeArabicText(letters);
                    if (normSelected.length === 1) {
                        if (normLetters.includes(normSelected)) matchingIds.push(sId);
                    } else {
                        if (normLetters.includes(normSelected) || normSelected.includes(normLetters)) matchingIds.push(sId);
                    }
                });

                targetSurahIds = matchingIds;
                derivedLetters = [selectedLetter];

                // If Cup Deduction is active, find counterpart vessels to subtract
                if (cupDeductionActive) {
                    const toSubtract = new Set<number>();

                    // 1. Specific known Quranic counterparts for compound vessels:
                    // If target contains طسم (26, 28) and letter is 'م', counterpart without 'م' is طس (27)
                    if (matchingIds.includes(26) || matchingIds.includes(28)) {
                        toSubtract.add(27); // النمل
                    }
                    // If target contains المر (13) and letter is 'م', counterpart without 'م' is الر (10, 11, 12, 14, 15)
                    if (matchingIds.includes(13)) {
                        [10, 11, 12, 14, 15].forEach(id => toSubtract.add(id));
                    }
                    // If target contains المص (7) and letter is 'ص', counterpart without 'ص' is الم (2, 3, 29, 30, 31, 32)
                    if (matchingIds.includes(7) && selectedLetter === 'ص') {
                        [2, 3, 29, 30, 31, 32].forEach(id => toSubtract.add(id));
                    }

                    // 2. If 'counterparts_and_others' is selected:
                    // Exclude any word that appears in ANY Noorani surah that does NOT contain the selected letter!
                    if (cupDeductionDepth === 'counterparts_and_others') {
                        Object.entries(MUQATTAAT_SURAHS).forEach(([sIdStr, letters]) => {
                            const sId = Number(sIdStr);
                            const normLetters = normalizeArabicText(letters);
                            if (!normLetters.includes(normSelected)) {
                                toSubtract.add(sId);
                            }
                        });
                    }

                    subtractedSurahIds = Array.from(toSubtract);
                    calculationLabel = `سور الحرف (${selectedLetter}): ${matchingIds.length} سورة [مكيال الأكواب: سكب ${subtractedSurahIds.length} وعاء مقابل]`;
                } else {
                    calculationLabel = `سور الحرف (${selectedLetter}): ${matchingIds.length} سورة`;
                }
            } else {
                // Mode: تقاطع المجموعات (Group A vs Group B)
                const lettersA = new Set<string>();
                groupASurahs.forEach(sId => {
                    const l = MUQATTAAT_SURAHS[sId];
                    if (l) for (const char of l) lettersA.add(char);
                });

                const lettersB = new Set<string>();
                groupBSurahs.forEach(sId => {
                    const l = MUQATTAAT_SURAHS[sId];
                    if (l) for (const char of l) lettersB.add(char);
                });

                const commonLetters = Array.from(lettersA).filter(c => lettersB.has(c));
                const unionSurahs = Array.from(new Set([...groupASurahs, ...groupBSurahs]));

                targetSurahIds = unionSurahs;
                derivedLetters = commonLetters;
                calculationLabel = `تقاطع المجموعات: حروف مشتركة [ ${commonLetters.join(' ، ') || 'لا يوجد'} ]`;
            }

            setProgressPercent(35);
            setProgressStatus('ملء الأوعية المستهدفة وفحص مواضع الكلمات...');
            await new Promise(resolve => setTimeout(resolve, 30));
            if (isCancelled || currentExecutionId !== executionIdRef.current) return;

            const targetSet = new Set(targetSurahIds);
            const subtractedSet = new Set(subtractedSurahIds);

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
            let eliminatedWordsCount = 0;

            // Step B: Iterate through words in chunks to keep UI responsive
            const allWordEntries = Array.from(quranWordIndex.entries());
            const totalWordsCount = allWordEntries.length;
            const chunkSize = 2500;

            for (let i = 0; i < totalWordsCount; i += chunkSize) {
                const chunk = allWordEntries.slice(i, i + chunkSize);

                for (const [rawWord, data] of chunk) {
                    // 1. Check presence in target vessel
                    let inTarget = false;
                    let targetOccurrences = 0;
                    const surahsPresent: number[] = [];

                    for (const sId of targetSet) {
                        const count = data.surahCounts.get(sId) || 0;
                        if (count > 0) {
                            inTarget = true;
                            targetOccurrences += count;
                            surahsPresent.push(sId);
                        }
                    }

                    if (!inTarget) continue;

                    // 2. CUP SUBTRACTION (طرح الأوعية):
                    // If the word appears in the subtracted vessel, eliminate it!
                    let inSubtractedVessel = false;
                    if (subtractedSet.size > 0) {
                        for (const sId of subtractedSet) {
                            if ((data.surahCounts.get(sId) || 0) > 0) {
                                inSubtractedVessel = true;
                                break;
                            }
                        }
                    }

                    if (inSubtractedVessel) {
                        eliminatedWordsCount++;
                        continue; // Eliminated by the cup difference!
                    }

                    // 3. Count occurrences across rest of Quran and other Muqattaat
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
                        isCupSubtractedPure: subtractedSet.size > 0,
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

                        if (!isEntireQuranExclusive) rEntry.isEntireQuranExclusive = false;
                        if (!isMuqattaatExclusive) rEntry.isMuqattaatExclusive = false;
                    }
                }

                // Update progress percentage smoothly
                const currentPercent = 35 + Math.round(((i + chunkSize) / totalWordsCount) * 40);
                setProgressPercent(Math.min(75, currentPercent));
                setProgressStatus(`سكب الأوعية المقابلة واستبعاد الكلمات المشتركة (${Math.round((i / totalWordsCount) * 100)}%)...`);
                await new Promise(resolve => setTimeout(resolve, 10));
                if (isCancelled || currentExecutionId !== executionIdRef.current) return;
            }

            setProgressPercent(80);
            setProgressStatus('تصفية النتائج والترتيب حسب نسبة التركيز والانفراد...');
            await new Promise(resolve => setTimeout(resolve, 20));
            if (isCancelled || currentExecutionId !== executionIdRef.current) return;

            // Step C: Filter and sort words
            let wordList = Array.from(wordsMap.values());

            if (filterStopWords) {
                wordList = wordList.filter(w => !COMMON_STOP_WORDS.has(w.rawWord) && !COMMON_STOP_WORDS.has(w.cleanWord));
            }

            if (minOccurrences > 1) {
                wordList = wordList.filter(w => w.targetOccurrences >= minOccurrences);
            }

            if (exclusivityLevel === 'all_quran') {
                wordList = wordList.filter(w => w.isEntireQuranExclusive);
            } else if (exclusivityLevel === 'muqattaat') {
                wordList = wordList.filter(w => w.isMuqattaatExclusive);
            } else if (exclusivityLevel === 'high_concentration') {
                wordList = wordList.filter(w => w.concentrationRatio >= 0.6);
            }

            if (searchQuery.trim()) {
                const q = normalizeArabicText(searchQuery.trim());
                wordList = wordList.filter(w =>
                    normalizeArabicText(w.rawWord).includes(q) ||
                    (w.root && normalizeArabicText(w.root).includes(q))
                );
            }

            // Sort: Entire Quran exclusive first, then concentration, then occurrences
            wordList.sort((a, b) => {
                if (a.isEntireQuranExclusive && !b.isEntireQuranExclusive) return -1;
                if (!a.isEntireQuranExclusive && b.isEntireQuranExclusive) return 1;
                if (b.concentrationRatio !== a.concentrationRatio) {
                    return b.concentrationRatio - a.concentrationRatio;
                }
                return b.targetOccurrences - a.targetOccurrences;
            });

            // Step D: Filter and sort roots
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

            setProgressPercent(100);
            setProgressStatus('اكتمل الاستنباط بنجاح!');
            await new Promise(resolve => setTimeout(resolve, 80));
            if (isCancelled || currentExecutionId !== executionIdRef.current) return;

            setExclusiveWords(wordList);
            setExclusiveRoots(rootList);
            setTotalEntireQuranExclusiveCount(entireQuranExclusiveCounter);
            setCalculationMeta({
                targetSurahs: targetSurahIds,
                subtractedSurahs: subtractedSurahIds,
                derivedLetters,
                label: calculationLabel,
                eliminatedCount: eliminatedWordsCount
            });

            setIsCalculating(false);
        };

        executeAnalysisAsync();

        return () => {
            isCancelled = true;
        };
    }, [
        analysisMode,
        selectedLetter,
        cupDeductionActive,
        cupDeductionDepth,
        selectedCupEqId,
        customVesselA,
        customVesselB,
        groupASurahs,
        groupBSurahs,
        exclusivityLevel,
        filterStopWords,
        minOccurrences,
        searchQuery,
        quranWordIndex
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

    // Toggle custom vessel surahs
    const toggleCustomVesselA = (id: number) => {
        setCustomVesselA(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleCustomVesselB = (id: number) => {
        setCustomVesselB(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Toggle surah in Group A
    const toggleGroupASurah = (id: number) => {
        setGroupASurahs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
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
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-2xs">
                            <span className="font-quran text-amber-700 dark:text-amber-300 font-bold text-lg">طس</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-text-primary leading-tight">
                                    المعجم الخالص للحروف النورانية (مكيال الأكواب)
                                </h2>
                                <button
                                    onClick={() => setShowMethodologyModal(true)}
                                    className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center gap-1"
                                    title="دليل آلية الأكواب والاستنباط"
                                >
                                    <span>💡 كيف يعمل المكيال؟</span>
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">
                                استخراج الكلمات المنفردة بكل حرف عبر طرح الأوعية المقابلة واستبعاد المفردات المشتركة
                            </p>
                        </div>
                    </div>

                    {/* Mode Switcher: Letter vs Cup Equations vs Group Intersection */}
                    <div className="flex items-center bg-surface-subtle border border-border-default p-1 rounded-xl text-xs flex-wrap gap-1">
                        <button
                            onClick={() => setAnalysisMode('letter')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                                analysisMode === 'letter'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-2xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            تحديد الحرف مباشرة
                        </button>
                        <button
                            onClick={() => setAnalysisMode('cup_equations')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
                                analysisMode === 'cup_equations'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-2xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <span>مكيال الأكواب (طرح الأوعية)</span>
                            <span className="text-[10px] px-1 rounded bg-black/15 font-mono">طسم−طس</span>
                        </button>
                        <button
                            onClick={() => setAnalysisMode('group_intersect')}
                            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                                analysisMode === 'group_intersect'
                                    ? 'bg-amber-500 text-primary-text-strong shadow-2xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            تقاطع المجموعات (طس × طسم)
                        </button>
                    </div>
                </div>

                {/* MODE 1: Direct Letter Selection with Cup Deduction Toggle */}
                {analysisMode === 'letter' && (
                    <div className="space-y-3 pt-2 border-t border-border-default/60">
                        {/* 14 Noorani Letters Badges */}
                        <div>
                            <div className="text-xs font-bold text-text-secondary mb-1.5 flex items-center justify-between">
                                <span>اختر حرفاً نورانياً:</span>
                                <span className="text-[11px] text-text-muted">انقر على أي حرف لعرض معجمه وبصمته</span>
                            </div>
                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                {NOORANI_LETTERS.map(letter => {
                                    const isSelected = selectedLetter === letter;
                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => setSelectedLetter(letter)}
                                            className={`min-w-[36px] px-2.5 py-1 text-base font-quran font-bold rounded-xl transition-all cursor-pointer ${
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
                            <div className="text-xs font-bold text-text-secondary mb-1.5">أو فصيلة مركبة من الفواتح:</div>
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

                        {/* FEATURE PROMINENT TOGGLE: مكيال الأكواب وحذف المفردات المشتركة */}
                        <div className="p-3 sm:p-3.5 rounded-xl bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 mt-0.5">
                                    <span className="font-bold text-sm">🍶</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <label className="text-xs sm:text-sm font-bold text-text-primary cursor-pointer flex items-center gap-2 select-none">
                                            <input
                                                type="checkbox"
                                                checked={cupDeductionActive}
                                                onChange={(e) => setCupDeductionActive(e.target.checked)}
                                                className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span>مكيال الأكواب: طرح الأوعية المقابلة وحذف المفردات المشتركة</span>
                                        </label>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                                            ميزة استنباطية دقيقة
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                        {cupDeductionActive
                                            ? `يتم الآن سكب الأوعية واستبعاد الكلمات التي اشتركت فيها فواتح أخرى (مثل طس للنمل، وسور الر) لعزل أثر (${selectedLetter}) الصافي دون شوائب.`
                                            : `الوضع الافتراضي: تُعرض كافة الكلمات الواردة في سور الحرف حتى وإن اشتركت فيها فواتح أخرى.`}
                                    </p>
                                </div>
                            </div>

                            {cupDeductionActive && (
                                <div className="flex items-center gap-2 text-xs self-end md:self-center">
                                    <span className="text-text-muted text-[11px]">عمق الاستبعاد:</span>
                                    <select
                                        value={cupDeductionDepth}
                                        onChange={(e) => setCupDeductionDepth(e.target.value as any)}
                                        className="bg-surface border border-border-default rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-hidden font-medium"
                                    >
                                        <option value="counterparts_and_others">نقاء الحرف الأقصى (استبعاد المشترك مع أي سورة لا تحويه)</option>
                                        <option value="counterparts_only">طرح الأوعية المقابلة المباشرة فقط (طسم − طس ، المر − الر)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODE 2: Dedicated Cup Equations (مكيال الأكواب القرآنية الجاهزة) */}
                {analysisMode === 'cup_equations' && (
                    <div className="space-y-3 pt-2 border-t border-border-default/60">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <span className="font-bold text-text-primary">اختر معادلة طرح قرآني من الأوعية المتناظرة:</span>
                            <span className="text-text-muted text-[11px]">
                                كما تستنبط 5 لتر من أوعية 3 و 7 لتر بسكب الزيت بينهما
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {PRESET_CUP_EQUATIONS.map(eq => {
                                const isSelected = selectedCupEqId === eq.id;
                                return (
                                    <button
                                        key={eq.id}
                                        onClick={() => setSelectedCupEqId(eq.id)}
                                        className={`p-3 rounded-xl text-right transition-all border cursor-pointer space-y-1.5 ${
                                            isSelected
                                                ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                                                : 'bg-surface-subtle hover:bg-surface border-border-default hover:border-amber-500/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-text-primary">{eq.title}</span>
                                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-500 text-primary-text-strong font-bold">
                                                {eq.deducedLetter}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-text-secondary leading-snug">
                                            {eq.description}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-text-muted pt-1 border-t border-border-default/50">
                                            <span>وعاء (أ): {eq.vesselAName}</span>
                                            <span>•</span>
                                            <span className="text-rose-600 dark:text-rose-400">مطروح منه: {eq.vesselBName}</span>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Custom Equation Card */}
                            <button
                                onClick={() => setSelectedCupEqId('custom')}
                                className={`p-3 rounded-xl text-right transition-all border cursor-pointer space-y-1.5 ${
                                    selectedCupEqId === 'custom'
                                        ? 'bg-purple-500/10 border-purple-500 shadow-xs ring-1 ring-purple-500/30'
                                        : 'bg-surface-subtle hover:bg-surface border-border-default hover:border-purple-500/40'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-text-primary">⚙️ معادلة مكيال مخصصة</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">
                                        أنت تختار
                                    </span>
                                </div>
                                <div className="text-[11px] text-text-secondary leading-snug">
                                    حدد يدوياً السور في الوعاء (أ) والسور المطلوب سكبها واستبعادها في الوعاء (ب).
                                </div>
                            </button>
                        </div>

                        {/* Custom Equation Builders */}
                        {selectedCupEqId === 'custom' && (
                            <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-2.5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    {/* Vessel A */}
                                    <div className="p-2.5 bg-surface rounded-lg border border-border-default space-y-1.5">
                                        <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                            <span>الوعاء (أ) - السور المستهدفة:</span>
                                            <span>{customVesselA.length} سور</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-0.5">
                                            {Object.entries(MUQATTAAT_SURAHS).map(([idStr, letters]) => {
                                                const sId = Number(idStr);
                                                const sRef = QURAN_INDEX.find(s => s.number === sId);
                                                const isSelected = customVesselA.includes(sId);
                                                return (
                                                    <button
                                                        key={sId}
                                                        onClick={() => toggleCustomVesselA(sId)}
                                                        className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-emerald-600 text-white font-bold'
                                                                : 'bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-default/60'
                                                        }`}
                                                    >
                                                        {getCleanSurahName(sRef?.name || '')} ({letters})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Vessel B */}
                                    <div className="p-2.5 bg-surface rounded-lg border border-border-default space-y-1.5">
                                        <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
                                            <span>الوعاء (ب) - السور المطلوب سكبها واستبعاد كلماتها:</span>
                                            <span>{customVesselB.length} سور</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-0.5">
                                            {Object.entries(MUQATTAAT_SURAHS).map(([idStr, letters]) => {
                                                const sId = Number(idStr);
                                                const sRef = QURAN_INDEX.find(s => s.number === sId);
                                                const isSelected = customVesselB.includes(sId);
                                                return (
                                                    <button
                                                        key={sId}
                                                        onClick={() => toggleCustomVesselB(sId)}
                                                        className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-rose-600 text-white font-bold'
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
                            </div>
                        )}
                    </div>
                )}

                {/* MODE 3: Multi-Group Intersection (Group A vs Group B) */}
                {analysisMode === 'group_intersect' && (
                    <div className="space-y-3 pt-2 border-t border-border-default/60">
                        <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-2.5">
                            <div className="text-xs font-bold text-text-primary">
                                تقاطع مجموعتين من سور الحروف لاستخراج الحرف المشترك تلقائياً:
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
                        </div>
                    </div>
                )}

                {/* Target Surahs Info Banner */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-surface-subtle p-2.5 rounded-xl border border-border-default/70">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-text-primary">{calculationMeta.label}</span>
                        <div className="flex items-center gap-1 flex-wrap mr-1">
                            {calculationMeta.targetSurahs.map(id => {
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

                    <div className="flex items-center gap-2 flex-wrap">
                        {calculationMeta.subtractedSurahs.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20 text-[11px]">
                                تم استبعاد {calculationMeta.eliminatedCount} كلمة مشتركة
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                            {totalEntireQuranExclusiveCount} كلمة منفردة بالقرآن كاملاً
                        </span>
                    </div>
                </div>
            </div>

            {/* MANDATORY PROGRESS BAR (User explicit request: وضع بروغرس بار دائماً لكي لا يتوقف المتصفح) */}
            {isCalculating && (
                <div className="bg-surface border border-amber-500/40 rounded-2xl p-4 shadow-sm space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                        <span className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                            <span>{progressStatus || 'جاري معالجة الكلمات وتطبيق مكيال الأكواب...'}</span>
                        </span>
                        <span className="font-mono text-amber-700 dark:text-amber-300 text-xs font-bold">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>

                    <div className="w-full bg-surface-subtle h-2.5 rounded-full overflow-hidden border border-border-default/70 p-0.5">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-amber-500 via-emerald-500 to-amber-600 transition-all duration-300 ease-out shadow-xs"
                            style={{ width: `${Math.max(6, progressPercent)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted flex-wrap gap-2">
                        <span>تتم المعالجة عبر أجزاء برمجية خفيفة لمنع تجميد المتصفح</span>
                        <span>مكيال الأكواب النورانية</span>
                    </div>
                </div>
            )}

            {/* Filter & Exclusivity Control Panel */}
            <div className={`bg-surface border border-border-default rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3 ${isCalculating ? 'opacity-50 pointer-events-none' : ''}`}>
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
                            placeholder="بحث في الكلمات والجذور المستنبطة..."
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
                            <span>استبعاد الأدوات العامة (في، من، قال...)</span>
                        </label>

                        {/* Minimum occurrences dropdown */}
                        <div className="flex items-center gap-1 text-text-secondary">
                            <span>التكرار الأدنى:</span>
                            <select
                                value={minOccurrences}
                                onChange={(e) => setMinOccurrences(Number(e.target.value))}
                                className="bg-surface-subtle border border-border-default rounded px-2 py-0.5 text-xs text-text-primary focus:outline-hidden font-medium"
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

            {/* Results Section: Words */}
            {resultTypeTab === 'words' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-text-muted px-1 flex-wrap gap-2">
                        <span>
                            عُثر على <strong className="text-text-primary font-bold">{exclusiveWords.length}</strong> كلمة تمثل البصمة الخالصة المستنبطة.
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
                                                            خالصة للأوعية المستهدفة
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
                                                    <span>مواضع ورود كلمة ({item.rawWord}) في السور المستهدفة:</span>
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
                            <div className="text-[11px]">جرب تخفيف شرط التكرار أو تصفية الكلمات العامة.</div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Section: Roots */}
            {resultTypeTab === 'roots' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-text-muted px-1">
                        <span>
                            عُثر على <strong className="text-text-primary font-bold">{exclusiveRoots.length}</strong> جذر لغوي خالص ناتج عن سكب الأوعية وطرح المشترك.
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
                                                    خالص للأوعية المستهدفة
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

            {/* METHODOLOGY EXPLANATION MODAL (دليل مكيال الأكواب ولغز الـ 10 لتر) */}
            {showMethodologyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
                    <div className="bg-surface border border-border-default rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border-default pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🍶</span>
                                <h3 className="text-base sm:text-lg font-bold text-text-primary">
                                    دليل مكيال الأكواب: آلية الاستنباط الجبري للحروف النورانية
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowMethodologyModal(false)}
                                className="p-1.5 rounded-xl hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            >
                                <ClearIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs sm:text-sm text-text-secondary leading-relaxed">
                            {/* The riddle metaphor */}
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-100 space-y-1.5">
                                <div className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                    <span>🏺</span>
                                    <span>لغز المكيال (الأكواب 3 و 7 و 10 لتر):</span>
                                </div>
                                <p className="text-xs leading-relaxed">
                                    عندما تملك قارورة 10 لتر زيت وتريد قسمتها 5 و 5، وليس لديك سوى كوب 3 لتر وكوب 7 لتر.. بالسكب المتتابع واستغلال الفارق بين سعة الأوعية، استطعت استنباط رقم (5) رغم عدم وجود وعاء يحمل الرقم 5 من الأصل!
                                </p>
                            </div>

                            {/* The Quranic application */}
                            <div className="space-y-1.5">
                                <h4 className="font-bold text-text-primary text-xs sm:text-sm flex items-center gap-1">
                                    <span>✨</span>
                                    <span>كيف ينطبق ذلك على الحروف المقطعة؟</span>
                                </h4>
                                <p>
                                    في القرآن الكريم، نزل حرف <strong>(الميم)</strong> دائماً مركباً مع حروف أخرى (الم، طسم، المر، حم). لا توجد سورة فواتحها «م» وحدها. فكيف نعرف الأثر اللغوي الصافي للميم؟
                                </p>
                                <div className="p-3 bg-surface-subtle rounded-xl border border-border-default font-mono text-center text-xs sm:text-sm text-primary font-bold">
                                    [ وعاء طسم: الشعراء والقصص ] − [ وعاء طس: النمل ] = ميم صافية (م)
                                </div>
                                <p>
                                    عندما نسكب وعاء النمل (طس) من وعاء الشعراء والقصص (طسم)، تُحذف كل الكلمات المشتركة التي تعود للطاء والسين، ويبقى فقط <strong>الفارق المعجمي الصافي الذي أحدثه دخول الميم</strong>!
                                </p>
                            </div>

                            {/* The formulas table */}
                            <div className="space-y-1.5 pt-2 border-t border-border-default/60">
                                <h4 className="font-bold text-text-primary text-xs sm:text-sm">
                                    معادلات الأكواب المتطابقة في القرآن الكريم:
                                </h4>
                                <ul className="space-y-1.5 text-xs">
                                    <li className="p-2 rounded-lg bg-surface-subtle border border-border-default/80 flex items-center justify-between">
                                        <span><strong>طسم − طس</strong> (الشعراء والقصص − النمل)</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">استنباط الميم</span>
                                    </li>
                                    <li className="p-2 rounded-lg bg-surface-subtle border border-border-default/80 flex items-center justify-between">
                                        <span><strong>المر − الر</strong> (الرعد − يونس وهود ويوسف وإبراهيم والحجر)</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">استنباط الميم</span>
                                    </li>
                                    <li className="p-2 rounded-lg bg-surface-subtle border border-border-default/80 flex items-center justify-between">
                                        <span><strong>المص − الم</strong> (الأعراف − سور الم الست)</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">استنباط الصاد</span>
                                    </li>
                                    <li className="p-2 rounded-lg bg-surface-subtle border border-border-default/80 flex items-center justify-between">
                                        <span><strong>المر − الم</strong> (الرعد − سور الم الست)</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">استنباط الراء</span>
                                    </li>
                                    <li className="p-2 rounded-lg bg-surface-subtle border border-border-default/80 flex items-center justify-between">
                                        <span><strong>حمعسق − حم</strong> (الشورى − الحواميم الستة)</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">استنباط (عسق)</span>
                                    </li>
                                </ul>
                            </div>

                            {/* What are the results */}
                            <div className="text-xs text-text-muted leading-relaxed">
                                💡 <strong>النتيجة النهائية:</strong> الكلمات المتبقية بعد التصفية هي المفردات التي انفرد بها ذلك الحرف دون أن يشاركه فيها الحرف المقابل، وهي أدق وسيلة علمية لاكتشاف دلالات الفواتح النورانية.
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border-default flex justify-end">
                            <button
                                onClick={() => setShowMethodologyModal(false)}
                                className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
                            >
                                فهمت الفكرة، إغلاق الدليل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
