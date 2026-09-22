import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { 
    PlayIcon, 
    SpinnerIcon, 
    CheckIcon, 
    BookOpenIcon, 
    InformationCircleIcon, 
    ArrowRightIcon, 
    SparklesIcon, 
    CopyIcon, 
    DocumentDuplicateIcon,
    SearchIcon
} from './icons';
import { 
    ARABIC_LETTERS, 
    ALL_LETTERS_MASK, 
    FlatWord, 
    ExtractionStrategy, 
    ScanDirection, 
    getLetterMask, 
    getWordStrategyMask,
    findShortestEnclosingWindow,
    findOptimalAlphabetWindow,
    countAyahsSpanned,
    extractAlphabetSequence, 
    countBits,
    PRESET_SCAN_POINTS,
    REFERENCE_ALPHABETS
} from '../utils/alphabetCipher';
import { ScannerResultCard } from './scanner/ScannerResultCard';
import { StepByStepInspector } from './scanner/StepByStepInspector';
import { DirectPositionPicker } from './scanner/DirectPositionPicker';
import { AlphabetComparator } from './scanner/AlphabetComparator';

interface AlphabetScannerViewProps {
    simpleCleanData: SurahData[];
}

interface ScanResult {
    L: number;
    R: number;
    length: number;
    targetIndex: number;
    scanMode: ScanDirection;
    strategy: ExtractionStrategy;
    targetLetterCount?: number;
    ayahsSpanned?: number;
}

const AlphabetScannerView: React.FC<AlphabetScannerViewProps> = ({ simpleCleanData }) => {
    // Navigation / Active Mode Tab - Default is the primary scanner engine
    const [activeTab, setActiveTab] = useState<'scanner' | 'inspector' | 'presets'>('scanner');

    // Word Search State
    const [targetWord, setTargetWord] = useState('');
    const [scanMode, setScanMode] = useState<ScanDirection>('optimal');
    const [searchStrategy, setSearchStrategy] = useState<ExtractionStrategy>('all_letters');
    const [searchTargetLetters, setSearchTargetLetters] = useState<number>(27);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [statusText, setStatusText] = useState('');
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

    // Inspector State
    const [inspectorStartIndex, setInspectorStartIndex] = useState<number>(0);
    const [inspectorStrategy, setInspectorStrategy] = useState<ExtractionStrategy>('first_letter');
    const [inspectorDirection, setInspectorDirection] = useState<ScanDirection>('optimal');
    const [inspectorTargetLetters, setInspectorTargetLetters] = useState<number>(27);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Build flattened word database with global indexes
    const flatWords: FlatWord[] = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return [];
        const words: FlatWord[] = [];
        let globalWordIdx = 0;

        simpleCleanData.forEach(surah => {
            surah.ayahs.forEach(ayah => {
                const ayahWords = ayah.text.split(/\s+/).filter(Boolean);
                ayahWords.forEach((w, wInAyah) => {
                    const norm = normalizeArabicText(w);
                    words.push({
                        index: globalWordIdx++,
                        text: w,
                        normalized: norm,
                        mask: getLetterMask(w),
                        surah: surah.number,
                        ayah: ayah.numberInSurah,
                        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                        wordInAyah: wInAyah
                    });
                });
            });
        });
        return words;
    }, [simpleCleanData]);

    // Initialize inspector with Al-Fath 48:29 on load
    useEffect(() => {
        if (flatWords.length > 0 && inspectorStartIndex === 0) {
            const fathWord = flatWords.find(w => w.surah === 48 && w.ayah === 29);
            if (fathWord) {
                setInspectorStartIndex(fathWord.index);
            }
        }
    }, [flatWords, inspectorStartIndex]);

    // Interactive inspector calculation
    const inspectorResult = useMemo(() => {
        if (flatWords.length === 0) {
            return {
                sequence: [],
                discoveredLetters: [],
                startWordIndex: 0,
                endWordIndex: 0,
                totalWordsSpanned: 0,
                isComplete27: false,
                isComplete28: false,
                isClusterComplete: false,
                targetLetterCount: inspectorTargetLetters,
                densityRatio: 0,
                strategy: inspectorStrategy,
                direction: inspectorDirection,
                firstLetter: '',
                missingLetters: ARABIC_LETTERS.split('')
            };
        }
        return extractAlphabetSequence(flatWords, inspectorStartIndex, inspectorStrategy, inspectorDirection, undefined, inspectorTargetLetters);
    }, [flatWords, inspectorStartIndex, inspectorStrategy, inspectorDirection, inspectorTargetLetters]);

    // Handle switching to inspector from anywhere
    const handleOpenInInspector = (
        startWordIndex: number, 
        strategy: ExtractionStrategy = 'all_letters', 
        direction: ScanDirection = 'forward',
        targetLetterCount: number = 27
    ) => {
        setInspectorStartIndex(startWordIndex);
        setInspectorStrategy(strategy);
        setInspectorDirection(direction);
        setInspectorTargetLetters(targetLetterCount);
        setActiveTab('inspector');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Word-based scanning algorithm
    const handleScan = () => {
        if (!targetWord.trim() || flatWords.length === 0) return;
        setIsScanning(true);
        setProgress(0);
        setResults([]);
        
        const normTarget = normalizeArabicText(targetWord.trim());
        const occurrences: number[] = [];
        for (let i = 0; i < flatWords.length; i++) {
            if (flatWords[i].normalized === normTarget) {
                occurrences.push(i);
            }
        }

        if (occurrences.length === 0) {
            setStatusText('لم يتم العثور على الكلمة في القرآن الكريم.');
            setIsScanning(false);
            return;
        }

        setStatusText(`تم العثور على ${occurrences.length} موضع للكلمة. جاري الفحص...`);

        const chunks: number[][] = [];
        const chunkSize = 50;
        for (let i = 0; i < occurrences.length; i += chunkSize) {
            chunks.push(occurrences.slice(i, i + chunkSize));
        }

        let currentChunk = 0;
        const foundResults: ScanResult[] = [];

        const processChunk = () => {
            if (currentChunk >= chunks.length) {
                if (scanMode === 'optimal') {
                    foundResults.sort((a, b) => {
                        const aA = a.ayahsSpanned ?? 999;
                        const bA = b.ayahsSpanned ?? 999;
                        if (aA !== bA) return aA - bA;
                        return a.length - b.length;
                    });
                } else {
                    foundResults.sort((a, b) => a.length - b.length);
                }
                setResults(foundResults);
                setProgress(100);
                setIsScanning(false);
                setStatusText(`اكتمل الفحص بنجاح! تم فحص ${occurrences.length} موضع.`);
                return;
            }

            const chunk = chunks[currentChunk];
            const isReached = (m: number) => searchTargetLetters === 27 ? m === ALL_LETTERS_MASK : countBits(m) >= searchTargetLetters;

            for (const idx of chunk) {
                if (scanMode === 'optimal') {
                    const optimal = findOptimalAlphabetWindow(flatWords, idx, searchStrategy, undefined, searchTargetLetters);
                    if (optimal && optimal.bestL !== -1 && optimal.bestR !== -1) {
                        foundResults.push({
                            L: optimal.bestL,
                            R: optimal.bestR,
                            length: optimal.bestLen,
                            targetIndex: idx,
                            scanMode: 'optimal',
                            strategy: searchStrategy,
                            targetLetterCount: searchTargetLetters,
                            ayahsSpanned: optimal.ayahsSpanned
                        });
                    }
                } else if (scanMode === 'shortest') {
                    const { bestL, bestR, bestLen } = findShortestEnclosingWindow(flatWords, idx, searchStrategy, undefined, searchTargetLetters);
                    if (bestL !== -1 && bestR !== -1) {
                        foundResults.push({
                            L: bestL,
                            R: bestR,
                            length: bestLen,
                            targetIndex: idx,
                            scanMode: 'shortest',
                            strategy: searchStrategy,
                            targetLetterCount: searchTargetLetters,
                            ayahsSpanned: countAyahsSpanned(flatWords, bestL, bestR)
                        });
                    }
                } else if (scanMode === 'forward') {
                    let mask = 0;
                    let foundR = -1;
                    for (let R = idx; R < flatWords.length; R++) {
                        mask |= getWordStrategyMask(flatWords[R], searchStrategy);
                        if (isReached(mask)) {
                            foundR = R;
                            break;
                        }
                    }
                    if (foundR !== -1) {
                        foundResults.push({
                            L: idx,
                            R: foundR,
                            length: foundR - idx + 1,
                            targetIndex: idx,
                            scanMode: 'forward',
                            strategy: searchStrategy,
                            targetLetterCount: searchTargetLetters,
                            ayahsSpanned: countAyahsSpanned(flatWords, idx, foundR)
                        });
                    }
                } else if (scanMode === 'backward') {
                    let mask = 0;
                    let foundL = -1;
                    for (let L = idx; L >= 0; L--) {
                        mask |= getWordStrategyMask(flatWords[L], searchStrategy);
                        if (isReached(mask)) {
                            foundL = L;
                            break;
                        }
                    }
                    if (foundL !== -1) {
                        foundResults.push({
                            L: foundL,
                            R: idx,
                            length: idx - foundL + 1,
                            targetIndex: idx,
                            scanMode: 'backward',
                            strategy: searchStrategy,
                            targetLetterCount: searchTargetLetters,
                            ayahsSpanned: countAyahsSpanned(flatWords, foundL, idx)
                        });
                    }
                }
            }

            currentChunk++;
            setProgress(Math.round((currentChunk / chunks.length) * 100));
            
            requestAnimationFrame(() => {
                setTimeout(processChunk, 10);
            });
        };

        setTimeout(processChunk, 50);
    };

    // Filter results by initial discovered letter
    const filteredResults = useMemo(() => {
        if (selectedLetters.length === 0) return results;
        return results.filter(res => {
            const ext = extractAlphabetSequence(
                flatWords,
                res.scanMode === 'shortest' ? res.targetIndex : (res.scanMode === 'backward' ? res.R : res.L),
                res.strategy || searchStrategy,
                res.scanMode,
                undefined,
                res.targetLetterCount || searchTargetLetters
            );
            return ext.firstLetter && selectedLetters.includes(ext.firstLetter);
        });
    }, [results, selectedLetters, flatWords, searchStrategy, searchTargetLetters]);

    const displayedResults = filteredResults.slice(0, 30);

    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto px-4 pb-24">
            {/* Main Header */}
            <div className="mb-6">
                <a href="#/structure" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-focus transition-colors mb-3 font-semibold text-sm">
                    <ArrowRightIcon className="w-4 h-4" />
                    العودة إلى بنية المصحف
                </a>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-primary-text flex items-center gap-3">
                                <SparklesIcon className="w-8 h-8 text-amber-500" />
                                ماسح الحروف الأبجدية ومستكشف الشيفرة
                            </h1>
                            <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 px-3 py-1 rounded-full font-bold">
                                أمر شامل: حرف الواو (و) خارج الأبجدية ومستثنى من كافة أنظمة المسح (الأساس 27 حرفاً)
                            </span>
                        </div>
                        <p className="text-text-secondary mt-1.5 text-sm sm:text-base leading-relaxed">
                            أداة بحثية متقدمة لاستكشاف شيفرة وترتيب الحروف الأبجدية الـ 27 (دون حرف الواو) في القرآن الكريم، مع إمكانية تأشير نقطة الانطلاق، واختيار طرق الانتقاء (متسلسلة أو أوائل الكلمات أو أواخرها)، ومطابقة النتائج مع التراتيب التاريخية واللغوية.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-default mb-6 overflow-x-auto gap-2 text-sm font-bold">
                <button
                    onClick={() => setActiveTab('scanner')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'scanner'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <SearchIcon className="w-4 h-4" />
                    <span>ماسح الحروف بالكلمة والنوافذ</span>
                </button>

                <button
                    onClick={() => setActiveTab('inspector')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'inspector'
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                    <span>مستكشف الشيفرة ومحاكي المسح التفاعلي</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        بوابة جديدة
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('presets')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'presets'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4 text-emerald-500" />
                    <span>الآيات الشاملة والأنظمة الأبجدية</span>
                </button>
            </div>

            {/* TAB 1: MAIN SCANNER ENGINE (ماسح الحروف بالكلمة والنوافذ) */}
            {activeTab === 'scanner' && (
                <div className="space-y-6">
                    {/* Quick Access to New Interactive Portal */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs">
                        <div className="flex items-center gap-2.5">
                            <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-text-primary">
                                <strong>بوابة جديدة ومستقلة:</strong> تم تخصيص بوابة مستقلة لـ <strong>مستكشف الشيفرة ومحاكي المسح التفاعلي</strong> لفحص مسار الحروف كلمة بكلمة واختبار التراتيب دون إعاقة عمل الماسح.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('inspector')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                            <span>فتح بوابة المحاكي التفاعلي</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-default">
                        {/* Strategy and Direction Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Strategy Selector (ميزة أوائل الكلمات ومناهج الاستخلاص) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-primary">
                                    طريقة استخلاص الحروف في المسح:
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-2 rounded-lg border border-border-default">
                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('first_letter')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'first_letter'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أوائل الكلمات</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'first_letter' ? 'text-white/80' : 'text-text-muted'}`}>
                                            الحرف الأول من كل كلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('all_letters')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'all_letters'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">جميع الحروف</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'all_letters' ? 'text-white/80' : 'text-text-muted'}`}>
                                            كل حروف الكلمات
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('last_letter')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'last_letter'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أواخر الكلمات</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'last_letter' ? 'text-white/80' : 'text-text-muted'}`}>
                                            الحرف الأخير من كل كلمة
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Scan Direction Selector (مسار المسح والمسح الذكي) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-primary flex items-center justify-between">
                                    <span>اتجاه ومسار محرك المسح:</span>
                                    {scanMode === 'optimal' && (
                                        <span className="text-[11px] font-normal text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                            <SparklesIcon className="w-3.5 h-3.5" />
                                            تدوير الاحتمالات وتقليل تباعد الآيات
                                        </span>
                                    )}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-subtle p-2 rounded-lg border border-border-default">
                                    <button
                                        type="button"
                                        onClick={() => setScanMode('optimal')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'optimal'
                                                ? 'bg-amber-600 text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-amber-400/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold flex items-center gap-1">
                                            <SparklesIcon className="w-3.5 h-3.5 text-amber-200" />
                                            <span>المسح الذكي</span>
                                        </span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'optimal' ? 'text-white/90' : 'text-text-muted'}`}>
                                            أقل عدد آيات
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScanMode('shortest')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'shortest'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أقصر نافذة</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'shortest' ? 'text-white/80' : 'text-text-muted'}`}>
                                            محيطة بالكلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScanMode('forward')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'forward'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">مسح تقدمي</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'forward' ? 'text-white/80' : 'text-text-muted'}`}>
                                            للأمام من الكلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScanMode('backward')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'backward'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">مسح تراجعي</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'backward' ? 'text-white/80' : 'text-text-muted'}`}>
                                            للخلف من الكلمة
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cluster Threshold Selector (عتبة اقتناص الكتلة المكتنزة والسماح بنقص أحرف) */}
                        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2.5 mb-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <label className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                                        عتبة اكتمال الكتلة المتتالية (اقتناص الأبجدية دون الواو مع استثناء النواقص):
                                    </label>
                                </div>
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                                    {searchTargetLetters === 27 
                                        ? 'كامل 27 حرفاً (100% دون الواو المستثنى)' 
                                        : `كتلة متتالية تطلب ${searchTargetLetters} حرفاً (سماح بنقص ${27 - searchTargetLetters} أحرف)`}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {[
                                    { count: 27, label: '27 (كامل)', sub: 'دون الواو' },
                                    { count: 26, label: '26 حرفاً', sub: 'سماح بنقص 1' },
                                    { count: 25, label: '25 حرفاً', sub: 'سماح بنقص 2' },
                                    { count: 24, label: '24 حرفاً', sub: 'سماح بنقص 3' },
                                    { count: 23, label: '23 حرفاً', sub: 'سماح بنقص 4' },
                                    { count: 22, label: '22 حرفاً', sub: 'سماح بنقص 5' },
                                ].map(item => (
                                    <button
                                        key={item.count}
                                        type="button"
                                        onClick={() => setSearchTargetLetters(item.count)}
                                        className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchTargetLetters === item.count
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-2xs ring-1 ring-amber-400/50'
                                                : 'bg-surface border-border-default text-text-secondary hover:border-amber-400/50'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">{item.label}</span>
                                        <span className="text-[10px] text-text-muted mt-0.5">{item.sub}</span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-[11px] text-text-muted leading-relaxed">
                                ✨ <strong>حرف الواو (و) مستثنى كلياً</strong> من كافة أنظمة المسح والعد الأبجدي. عند مسح أوائل الكلمات، قد تقع حروف نادرة في آيات متباعدة جداً مما يشتت النافذة ويضخم عدد الكلمات؛ يتيح لك هذا الخيار التقاط الكتل المتراصة المتتالية فور استيفاء العدد المستهدف (مثلاً 24 أو 25 أو 26) دون تشتت.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={targetWord}
                                onChange={(e) => setTargetWord(e.target.value)}
                                placeholder="أدخل كلمة للبحث حولها (مثال: الأرض، موسى، الله)..."
                                className="flex-1 bg-surface-subtle border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-amiri text-lg"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
                                disabled={isScanning}
                            />
                            <button
                                onClick={handleScan}
                                disabled={isScanning || !targetWord.trim()}
                                className="bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isScanning ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                                        <span>جاري الفحص...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlayIcon className="w-5 h-5" />
                                        <span>بدء المسح</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {(isScanning || progress > 0) && (
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-text-secondary">{statusText}</span>
                                    <span className="text-primary font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-border-subtle rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-primary-text">
                                    النتائج ({filteredResults.length} موضع)
                                </h2>
                                
                                <div className="flex items-center gap-2">
                                    {selectedLetters.length > 0 && (
                                        <button 
                                            onClick={() => setSelectedLetters([])}
                                            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                                        >
                                            إلغاء تصفية الحروف ✕
                                        </button>
                                    )}
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full font-bold">
                                        {scanMode === 'shortest' ? 'مرتبة من الأقصر إلى الأطول' : 'مرتبة حسب موضع الكلمة'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Filter by First Discovered Letter */}
                            <div className="bg-surface-subtle p-4 rounded-xl border border-border-default">
                                <h3 className="text-sm font-bold text-text-primary mb-3">تصفية النتائج حسب أول حرف مكتشف:</h3>
                                <div className="flex flex-wrap gap-1.5" dir="rtl">
                                    {ARABIC_LETTERS.split('').map(letter => {
                                        const isSelected = selectedLetters.includes(letter);
                                        return (
                                            <button
                                                key={letter}
                                                onClick={() => {
                                                    setSelectedLetters(prev => 
                                                        prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
                                                    );
                                                }}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-sm transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-primary text-white border-primary shadow-md scale-110' 
                                                        : 'bg-surface border-border-default text-text-secondary hover:border-primary/50 hover:text-primary'
                                                }`}
                                            >
                                                {letter}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Render Scanner Result Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                {displayedResults.map((res, idx) => (
                                    <ScannerResultCard 
                                        key={idx} 
                                        res={res} 
                                        idx={idx} 
                                        flatWords={flatWords}
                                        onOpenInspector={handleOpenInInspector}
                                    />
                                ))}
                            </div>

                            {results.length > 30 && (
                                <p className="text-center text-text-muted mt-6 text-sm">
                                    تم عرض أفضل 30 نتيجة من أصل {filteredResults.length}.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DEDICATED NEW PORTAL - INTERACTIVE CIPHER INSPECTOR & SIMULATOR (بوابة مستكشف الشيفرة والمحاكي التفاعلي) */}
            {activeTab === 'inspector' && (
                <div className="space-y-6">
                    {/* Portal Header Card */}
                    <div className="bg-surface rounded-xl border border-amber-500/30 p-5 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <SparklesIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                                            بوابة مستكشف الشيفرة ومحاكي المسح التفاعلي
                                        </h2>
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                                            بوابة تفاعلية متخصصة
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-text-secondary mt-1">
                                        بيئة متقدمة لتتبع ومحاكاة مسار الحروف الـ 27 كلمة بكلمة، واختبار نقاط الانطلاق ونوافذ الكتل المتراصة
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('scanner')}
                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <SearchIcon className="w-4 h-4" />
                                <span>← العودة إلى ماسح الحروف بالكلمة</span>
                            </button>
                        </div>
                    </div>

                    {/* Direct Position Picker & Pointer Component */}
                    <DirectPositionPicker
                        flatWords={flatWords}
                        currentStartIndex={inspectorStartIndex}
                        currentStrategy={inspectorStrategy}
                        currentDirection={inspectorDirection}
                        currentTargetLetterCount={inspectorTargetLetters}
                        onSelectPosition={(startIdx, strat, dir, targetCount) => {
                            setInspectorStartIndex(startIdx);
                            setInspectorStrategy(strat);
                            setInspectorDirection(dir);
                            if (targetCount !== undefined) {
                                setInspectorTargetLetters(targetCount);
                            }
                        }}
                    />

                    {/* Step by Step Simulator and Word-by-Word Explorer */}
                    <StepByStepInspector
                        result={inspectorResult}
                        flatWords={flatWords}
                        targetLetterCount={inspectorTargetLetters}
                        onReScanFromWord={(wIdx, strat, dir, targetCount) => {
                            setInspectorStartIndex(wIdx);
                            setInspectorStrategy(strat);
                            setInspectorDirection(dir);
                            if (targetCount !== undefined) {
                                setInspectorTargetLetters(targetCount);
                            }
                        }}
                    />
                </div>
            )}

            {/* TAB 3: UNIVERSAL VERSES & ALPHABET SYSTEMS REFERENCE */}
            {activeTab === 'presets' && (
                <div className="space-y-6">
                    {/* Record Breaking Optimal Clusters Card */}
                    <div className="bg-surface rounded-xl border border-border-default p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border-default pb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <span>الكتل القياسية لاكتمال الأبجدية من أوائل الكلمات (المسح الذكي)</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                        أقل عدد آيات
                                    </span>
                                </h3>
                                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                    نتائج تدوير خوارزمية المسح الذكي لاقتناص الأبجدية كاملة (27 حرفاً دون الواو) بأعلى كثافة وتقارب بين الكلمات
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PRESET_SCAN_POINTS.filter(p => p.id === 'anam_94' || p.id === 'nisa_1' || p.id === 'yunus_2').map(preset => (
                                <div key={preset.id} className="bg-surface-subtle rounded-xl p-5 border border-border-default flex flex-col justify-between space-y-4 hover:border-amber-400/40 transition-colors">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-text-primary text-sm">
                                                {preset.title}
                                            </span>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                                سورة {preset.surahName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                                            {preset.description}
                                        </p>
                                        <p className="font-amiri text-base text-text-primary leading-loose bg-surface p-3 rounded-lg border border-border-subtle text-justify" dir="rtl">
                                            {preset.preview}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const match = flatWords.find(w => w.surah === preset.surah && w.ayah === preset.ayah);
                                            if (match) {
                                                handleOpenInInspector(match.index, 'first_letter', 'optimal');
                                            }
                                        }}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                                    >
                                        <SparklesIcon className="w-4 h-4 text-amber-200" />
                                        <span>فحص هذه الكتلة في المسح الذكي</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Universal Verses Card */}
                    <div className="bg-surface rounded-xl border border-border-default p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border-default pb-4">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <BookOpenIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">
                                    الآيات القرآنية الشاملة لجميع حروف الهجاء الـ 28
                                </h3>
                                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                    آيتان كريمتان في كتاب الله جمعت كل منهما حروف الأبجدية العربية الثمانية والعشرين كاملة دون نقص
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PRESET_SCAN_POINTS.filter(p => p.id === 'fath_29' || p.id === 'imran_154').map(preset => (
                                <div key={preset.id} className="bg-surface-subtle rounded-xl p-5 border border-border-default flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-text-primary text-base">
                                                {preset.title}
                                            </span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                سورة {preset.surahName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-3">
                                            {preset.description}
                                        </p>
                                        <p className="font-amiri text-lg text-text-primary leading-loose bg-surface p-3.5 rounded-lg border border-border-subtle text-justify" dir="rtl">
                                            {preset.preview}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const match = flatWords.find(w => w.surah === preset.surah && w.ayah === preset.ayah);
                                            if (match) {
                                                handleOpenInInspector(match.index, 'all_letters', 'forward');
                                            }
                                        }}
                                        className="w-full bg-primary hover:bg-primary-focus text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                        <span>فحص هذه الآية في المستكشف التفاعلي</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Educational Guide on Arabic Alphabet Systems */}
                    <div className="bg-surface rounded-xl border border-border-default p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                                    <BookOpenIcon className="w-5 h-5 text-primary" />
                                    <span>الأنظمة المرجعية لترتيب الحروف العربية في التراث اللغوي والإحصائي:</span>
                                </h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    يمكنك نسخ أي تسلسل أبجدي أدناه بنقرة واحدة بصيغ متعددة (مفصول بشرطات، متصل، أو قائمة مرقمة)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {REFERENCE_ALPHABETS.map((refItem) => {
                                const isFrequency = refItem.id === 'quran_frequency';
                                return (
                                    <div 
                                        key={refItem.id} 
                                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                                            isFrequency 
                                                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-2xs' 
                                                : 'bg-surface-subtle border-border-default'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                                    {isFrequency && <SparklesIcon className="w-4 h-4 text-amber-500" />}
                                                    <span>{refItem.name.split('(')[0]}</span>
                                                </h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                        {refItem.sequence.length} حرفاً
                                                    </span>
                                                    {isFrequency && (
                                                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                                                            مميز
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                {refItem.description}
                                            </p>

                                            {/* Visual Sequence Chips */}
                                            <div className="bg-surface p-2 rounded-lg border border-border-subtle flex flex-wrap gap-1 font-amiri text-xs text-primary font-bold" dir="rtl">
                                                {refItem.sequence.split('').map((char, cIdx) => (
                                                    <span key={cIdx} className="w-5 h-5 flex items-center justify-center rounded bg-surface-subtle border border-border-subtle text-[11px]" title={`#${cIdx + 1}: ${char}`}>
                                                        {char}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Copy Actions for this alphabet */}
                                        <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                            <span className="text-[11px] font-bold text-text-secondary">نسخ الترتيب:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        const text = refItem.sequence.split('').join(' - ');
                                                        navigator.clipboard.writeText(text).then(() => {
                                                            alert(`تم نسخ ${refItem.name.split('(')[0]} مفصولاً بشرطات!`);
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="نسخ مفصول بشرطات (ا - ب - ج)"
                                                >
                                                    <CopyIcon className="w-3 h-3" />
                                                    <span>بشرطات</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(refItem.sequence).then(() => {
                                                            alert(`تم نسخ ${refItem.name.split('(')[0]} متصلاً!`);
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded bg-surface border border-border-default hover:bg-surface-hover text-text-primary font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="نسخ متصل (ابج...)"
                                                >
                                                    <CopyIcon className="w-3 h-3" />
                                                    <span>متصل</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlphabetScannerView;
