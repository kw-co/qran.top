import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { SurahData, Ayah, SavedItem } from '../types';
import { 
    ARABIC_LETTERS_META, 
    LETTER_GROUP_PRESETS, 
    LetterGroupPreset,
    LetterMeta,
    MatchingMode,
    MatchedAyahResult,
    ScanProgressState,
    ScanSummaryStats,
    IndexProgressState,
    isAyahIndexReady,
    ensureAyahIndexAsync,
    executeChunkedAlphabetScan
} from '../utils/alphabetMatrix';
import { 
    SparklesIcon, 
    SearchIcon, 
    ClearIcon, 
    CopyIcon, 
    CheckIcon, 
    ArrowRightIcon, 
    SpeakerWaveIcon,
    BookOpenIcon,
    SpinnerIcon,
    XIcon
} from './icons';
import { QURAN_INDEX } from '../quranIndex';

interface UniversalAlphabetMatrixViewProps {
    simpleCleanData: SurahData[];
    displayEditionData?: SurahData[];
    onSaveAyah?: (item: SavedItem) => void;
    onStartPlayback?: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    currentlyPlayingAyahGlobalNumber?: number | null;
}

export const UniversalAlphabetMatrixView: React.FC<UniversalAlphabetMatrixViewProps> = ({
    simpleCleanData,
    displayEditionData,
    onSaveAyah,
    onStartPlayback,
    currentlyPlayingAyahGlobalNumber
}) => {
    // 0. Database Indexing State
    const [isIndexReady, setIsIndexReady] = useState<boolean>(() => isAyahIndexReady());
    const [indexProgress, setIndexProgress] = useState<IndexProgressState>({
        isIndexing: !isAyahIndexReady(),
        percent: isAyahIndexReady() ? 100 : 0,
        currentSurahNumber: 1,
        currentSurahName: 'الفاتحة',
        indexedAyahsCount: 0,
        totalAyahsCount: 6236
    });

    // 1. Selection State for Letters
    const [selectedLetters, setSelectedLetters] = useState<string[]>(['ا', 'ل', 'م', 'ص', 'ر', 'ك', 'ه', 'ي', 'ع', 'ط', 'س', 'ح', 'ق', 'ن']);
    const [activePresetId, setActivePresetId] = useState<string>('noorani-pure');
    const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | 'noorani' | 'tajweed' | 'fawatih' | 'linguistic'>('all');

    // 2. Scan Rules & Modes
    const [matchingMode, setMatchingMode] = useState<MatchingMode>('pure_or_purity');
    const [purityThreshold, setPurityThreshold] = useState<number>(100);
    const [excludeFawatih, setExcludeFawatih] = useState<boolean>(false);
    const [surahScope, setSurahScope] = useState<'all' | 'fawatih_surahs' | 'meccan' | 'medinan' | 'single_surah'>('all');
    const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);

    // 3. Scan Execution & Progress
    const [progressState, setProgressState] = useState<ScanProgressState>({
        isScanning: false,
        percent: 0,
        currentSurahNumber: 1,
        currentSurahName: 'الفاتحة',
        totalSurahs: 114,
        scannedAyahsCount: 0,
        totalAyahsCount: 6236,
        matchedAyahsCount: 0,
        elapsedMs: 0
    });

    const [wasCancelled, setWasCancelled] = useState<boolean>(false);
    const [scanResults, setScanResults] = useState<MatchedAyahResult[]>([]);
    const [scanStats, setScanStats] = useState<ScanSummaryStats | null>(null);

    // 4. View Tabs & Pagination
    const [activeTab, setActiveTab] = useState<'ayahs' | 'frequencies' | 'surahs' | 'streaks'>('ayahs');
    const [displayMode, setDisplayMode] = useState<'words' | 'text'>('words');
    const [localQuery, setLocalQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [copiedAll, setCopiedAll] = useState<boolean>(false);
    const [savedAyahMap, setSavedAyahMap] = useState<{ [key: string]: boolean }>({});
    const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);

    // Cancel refs
    const cancelScanRef = useRef<(() => void) | null>(null);
    const cancelIndexRef = useRef<(() => void) | null>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Progressive asynchronous index initialization
    useEffect(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return;

        if (isAyahIndexReady()) {
            setIsIndexReady(true);
            return;
        }

        const cancelFn = ensureAyahIndexAsync(
            simpleCleanData,
            (prog) => {
                setIndexProgress(prog);
            },
            () => {
                setIsIndexReady(true);
            }
        );

        cancelIndexRef.current = cancelFn;
        return () => {
            if (cancelIndexRef.current) cancelIndexRef.current();
        };
    }, [simpleCleanData]);

    // Perform scan whenever filters change AND index is ready
    const triggerScan = useCallback(() => {
        if (!isIndexReady || !simpleCleanData || simpleCleanData.length === 0) return;

        if (cancelScanRef.current) {
            cancelScanRef.current();
        }

        setWasCancelled(false);
        setProgressState(prev => ({
            ...prev,
            isScanning: true,
            percent: 0,
            scannedAyahsCount: 0,
            matchedAyahsCount: 0,
            elapsedMs: 0
        }));

        const cancelFn = executeChunkedAlphabetScan(
            simpleCleanData,
            {
                selectedLetters,
                matchingMode,
                purityThreshold,
                excludeFawatih,
                surahScope,
                selectedSurahNumber
            },
            (prog) => {
                setProgressState(prog);
            },
            (results, stats) => {
                setScanResults(results);
                setScanStats(stats);
                setCurrentPage(1);
            }
        );

        cancelScanRef.current = cancelFn;
    }, [isIndexReady, simpleCleanData, selectedLetters, matchingMode, purityThreshold, excludeFawatih, surahScope, selectedSurahNumber]);

    useEffect(() => {
        if (isIndexReady) {
            triggerScan();
        }
        return () => {
            if (cancelScanRef.current) {
                cancelScanRef.current();
            }
        };
    }, [isIndexReady, triggerScan]);

    // Handle Manual Stop / Cancel Scan
    const handleStopScan = () => {
        if (cancelScanRef.current) {
            cancelScanRef.current();
            cancelScanRef.current = null;
        }
        setWasCancelled(true);
        setProgressState(prev => ({
            ...prev,
            isScanning: false
        }));
    };

    // Handle Manual Restart Scan
    const handleRestartScan = () => {
        triggerScan();
    };

    // Letter Toggle
    const handleToggleLetter = (char: string) => {
        setActivePresetId('');
        setSelectedLetters(prev => {
            if (prev.includes(char)) {
                return prev.filter(c => c !== char);
            } else {
                return [...prev, char];
            }
        });
    };

    // Apply Preset
    const handleApplyPreset = (preset: LetterGroupPreset) => {
        setActivePresetId(preset.id);
        setSelectedLetters(preset.letters);
    };

    // Quick Matrix Actions
    const handleSelectAll = () => {
        setActivePresetId('all-letters');
        setSelectedLetters(ARABIC_LETTERS_META.map(l => l.char));
    };

    const handleClearAll = () => {
        setActivePresetId('');
        setSelectedLetters([]);
    };

    const handleInvertSelection = () => {
        setActivePresetId('');
        const currentSet = new Set(selectedLetters);
        const inverted = ARABIC_LETTERS_META.map(l => l.char).filter(c => !currentSet.has(c));
        setSelectedLetters(inverted);
    };

    // Filtered Presets by Category
    const filteredPresets = useMemo(() => {
        if (presetCategoryFilter === 'all') return LETTER_GROUP_PRESETS;
        return LETTER_GROUP_PRESETS.filter(p => p.category === presetCategoryFilter);
    }, [presetCategoryFilter]);

    // Local Text Filter within results
    const filteredResults = useMemo(() => {
        if (!localQuery.trim()) return scanResults;
        const q = localQuery.trim().toLowerCase();
        return scanResults.filter(r => 
            r.textNormalized.includes(q) || 
            r.surahName.includes(q) || 
            r.textOriginal.includes(q) ||
            r.ayahNumberInSurah.toString() === q
        );
    }, [scanResults, localQuery]);

    // Paginated results
    const totalPages = pageSize > 0 ? Math.ceil(filteredResults.length / pageSize) : 1;
    const paginatedResults = useMemo(() => {
        if (pageSize === 0) return filteredResults;
        const start = (currentPage - 1) * pageSize;
        return filteredResults.slice(start, start + pageSize);
    }, [filteredResults, currentPage, pageSize]);

    // Copy single ayah
    const handleCopySingle = (item: MatchedAyahResult) => {
        const text = `${item.textOriginal} [سورة ${item.surahName}: ${item.ayahNumberInSurah}]`;
        navigator.clipboard.writeText(text);
        const key = `${item.surahNumber}:${item.ayahNumberInSurah}`;
        setCopiedAyahKey(key);
        setTimeout(() => setCopiedAyahKey(null), 2000);
    };

    // Save to Notebook
    const handleSaveSingle = (item: MatchedAyahResult) => {
        if (!onSaveAyah) return;
        const key = `${item.surahNumber}:${item.ayahNumberInSurah}`;
        const savedItem: SavedItem = {
            id: key,
            type: 'ayah',
            surah: item.surahNumber,
            ayah: item.ayahNumberInSurah,
            text: item.textOriginal,
            createdAt: Date.now(),
            notes: `مطابقة مصفوفة الحروف (${item.purityPercentage}% نقاوة)`
        };
        onSaveAyah(savedItem);
        setSavedAyahMap(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setSavedAyahMap(prev => ({ ...prev, [key]: false }));
        }, 2000);
    };

    // Copy All Results
    const handleCopyAllResults = () => {
        const text = filteredResults.map(r => `${r.textOriginal} [سورة ${r.surahName}: ${r.ayahNumberInSurah}]`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
    };

    // Get display text from displayEditionData if available
    const getDisplayText = (surahNum: number, ayahNum: number, fallback: string) => {
        if (!displayEditionData) return fallback;
        const s = displayEditionData.find(sur => sur.number === surahNum);
        if (!s) return fallback;
        const a = s.ayahs.find(ay => ay.numberInSurah === ayahNum);
        return a ? a.text : fallback;
    };

    return (
        <div className="container mx-auto p-3 sm:p-6 lg:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border-default/60">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                    <a href="#/" className="hover:text-primary transition-colors">الرئيسية</a>
                    <span>/</span>
                    <a href="#/structure" className="hover:text-primary transition-colors">بنية المصحف الشريف</a>
                    <span>/</span>
                    <span className="text-text-primary font-bold">المصفوفة الأبجدية الشاملة</span>
                </div>

                <div className="flex items-center gap-2">
                    <a 
                        href="#/noorani" 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>ماسح الآيات النورانية</span>
                    </a>
                </div>
            </div>

            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-br from-purple-500/10 via-indigo-500/5 to-cyan-500/10 border border-purple-200/60 dark:border-purple-800/40 shadow-xs">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-bold">
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span>مختبر التراكيب الحرفية والبصمة الأبجدية</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-primary">
                            المصفوفة الأبجدية الشاملة
                        </h1>
                        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                            محرك تفاعلي لفحص وتصفية <span className="font-bold text-text-primary">جميع آيات القرآن الكريم (6,236 آية)</span> بدلالة أي تركيبة مخصصة من حروف المعجم الـ 28 مع قياس الترددات ونسب النقاوة الحرفية والتراكيب الجامعة.
                        </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 p-4 rounded-2xl bg-surface/80 backdrop-blur-xs border border-border-default shadow-xs shrink-0">
                        <div className="text-center sm:text-right">
                            <div className="text-xs text-text-muted font-medium">الحروف المحددة حالياً</div>
                            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                                {selectedLetters.length} <span className="text-xs font-normal text-text-muted">/ 28 حرفاً</span>
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                            <div className="text-xs text-text-muted font-medium">الآيات المطابقة للمصفوفة</div>
                            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {progressState.isScanning ? (
                                    <span className="inline-flex items-center gap-1.5 text-base">
                                        <SpinnerIcon className="w-4 h-4" />
                                        <span>جاري الحساب...</span>
                                    </span>
                                ) : (
                                    <span>{scanResults.length} <span className="text-xs font-normal text-text-muted">آية</span></span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INITIAL INDEXING PROGRESS BAR (If first time loading) */}
            {!isIndexReady && (
                <div className="p-5 bg-surface rounded-3xl border-2 border-purple-400 dark:border-purple-600 shadow-md space-y-3 animate-pulse">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                            <span>جاري تهيئة وفهرسة نصوص المصحف الشريف لأول مرة...</span>
                        </div>
                        <div className="text-text-muted font-mono">
                            سورة {indexProgress.currentSurahName} ({indexProgress.currentSurahNumber}/114) • {indexProgress.percent}%
                        </div>
                    </div>

                    <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden border border-border-default/60">
                        <div 
                            className="h-full bg-linear-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-150"
                            style={{ width: `${indexProgress.percent}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-text-muted text-center">
                        تمت فهرسة {indexProgress.indexedAyahsCount.toLocaleString()} من أصل 6,236 آية (يتم التحميل بالخلفية بدون تجميد المتصفح)
                    </div>
                </div>
            )}

            {/* REAL-TIME SCANNING PROGRESS BAR WITH CANCEL / STOP BUTTON */}
            {isIndexReady && (
                <div className="p-4 sm:p-5 bg-surface rounded-2xl border border-border-default shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                            {progressState.isScanning ? (
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                </span>
                            ) : wasCancelled ? (
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                            ) : (
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            )}

                            <span className="text-text-primary">
                                {progressState.isScanning ? (
                                    <>جاري فحص المصحف: <span className="text-purple-600 dark:text-purple-400 font-bold">سورة {progressState.currentSurahName} ({progressState.currentSurahNumber}/114)</span></>
                                ) : wasCancelled ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">تم إيقاف الفحص يدوياً بواسطة المستخدم</span>
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">اكتمل الفحص الشامل للمصحف الشريف</span>
                                )}
                            </span>
                        </div>

                        {/* Controls: Cancel / Restart & Progress Stats */}
                        <div className="flex items-center gap-3">
                            <span className="text-text-muted text-[11px] hidden sm:inline">
                                مفحوص: {progressState.scannedAyahsCount.toLocaleString()} / 6,236 آية
                            </span>

                            {progressState.isScanning ? (
                                <button
                                    onClick={handleStopScan}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-200 dark:border-rose-900/40 cursor-pointer shadow-2xs"
                                    title="إيقاف عملية الفحص الحالية فوراً"
                                >
                                    <XIcon className="w-3.5 h-3.5" />
                                    <span>إلغاء / إيقاف الفحص</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleRestartScan}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all border border-purple-200 dark:border-purple-800/40 cursor-pointer shadow-2xs"
                                    title="إعادة تشغيل مسح الآيات من البداية"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    <span>إعادة الفحص</span>
                                </button>
                            )}

                            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-xs">{progressState.percent}%</span>
                        </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-border-default/60">
                        <div 
                            className={`h-full transition-all duration-150 rounded-full ${
                                progressState.isScanning 
                                    ? 'bg-linear-to-r from-purple-500 via-indigo-500 to-emerald-400' 
                                    : wasCancelled
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressState.percent}%` }}
                        />
                    </div>

                    {wasCancelled && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-center justify-between">
                            <span>تم إيقاف الفحص عند الآية {progressState.scannedAyahsCount}. يتم الآن عرض النتائج الجزئية التي تم العثور عليها ({scanResults.length} آية).</span>
                            <button
                                onClick={handleRestartScan}
                                className="underline font-bold hover:text-primary cursor-pointer shrink-0 mr-2"
                            >
                                استئناف ومسح الكل
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Presets & Linguistic Categories Filter */}
            <div className="p-4 sm:p-5 bg-surface rounded-2xl border border-border-default shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary">المجموعات اللغوية والتجويدية الجاهزة:</span>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-border-default text-xs">
                        <button
                            onClick={() => setPresetCategoryFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                presetCategoryFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setPresetCategoryFilter('noorani')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                presetCategoryFilter === 'noorani' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            النورانية والفواتح
                        </button>
                        <button
                            onClick={() => setPresetCategoryFilter('tajweed')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                presetCategoryFilter === 'tajweed' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            التجويد والمخارج
                        </button>
                        <button
                            onClick={() => setPresetCategoryFilter('linguistic')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                presetCategoryFilter === 'linguistic' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            الشمسية والقمرية
                        </button>
                    </div>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {filteredPresets.map(preset => {
                        const isSelected = activePresetId === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handleApplyPreset(preset)}
                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs scale-102'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border-border-default hover:border-purple-400'
                                }`}
                                title={preset.description}
                            >
                                <span>{preset.title}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-surface text-text-muted group-hover:text-purple-600'
                                }`}>
                                    {preset.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* The 28 Arabic Letters Matrix Grid */}
            <div className="p-4 sm:p-6 bg-surface rounded-3xl border border-border-default shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default/60">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-text-primary">
                            شبكة حروف المعجم الـ 28 (تخصيص حر)
                        </h2>
                        <p className="text-xs text-text-muted">
                            انقر على أي حرف لتفعيله أو إلغائه، وشاهد تحديث نتائج فحص المصحف فورياً.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                            تحديد الكل (28)
                        </button>
                        <button
                            onClick={handleInvertSelection}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                            عكس التحديد
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                            مسح التحديد
                        </button>
                    </div>
                </div>

                {/* 28 Letters Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-2">
                    {ARABIC_LETTERS_META.map(meta => {
                        const isSelected = selectedLetters.includes(meta.char);
                        const freq = scanStats?.letterFrequencyInMatched[meta.char] || 0;

                        return (
                            <button
                                key={meta.char}
                                onClick={() => handleToggleLetter(meta.char)}
                                className={`group relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-102 ring-2 ring-purple-400/40'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border-border-default opacity-70 hover:opacity-100'
                                }`}
                                title={`${meta.name} - مخرجه: ${meta.makhraj} - قيمة الجمل: ${meta.abjad}`}
                            >
                                <span className="font-quran text-2xl font-bold leading-none mb-1">
                                    {meta.char}
                                </span>
                                <span className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-purple-100' : 'text-text-muted'}`}>
                                    {meta.name}
                                </span>
                                
                                {isSelected && (
                                    <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-white/20 text-white">
                                        {freq > 0 ? freq.toLocaleString() : '✓'}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Matching Rules & Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 bg-surface rounded-3xl border border-border-default shadow-xs">
                {/* Rule 1: Matching Mode */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary block">
                        نمط المطابقة والتركيب:
                    </label>
                    <select
                        value={matchingMode}
                        onChange={(e) => setMatchingMode(e.target.value as MatchingMode)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                    >
                        <option value="pure_or_purity">الآيات الحصرية (تتألف حصراً أو بأعلى نسبة من الحروف)</option>
                        <option value="must_contain_all">الآيات الجامعة (تحتوي بالضرورة على كل الحروف المختارة معاً)</option>
                        <option value="zero_occurrences">الآيات الخالية تماماً (تخلو من كافة الحروف المختارة)</option>
                    </select>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                        {matchingMode === 'pure_or_purity' && 'تصفية الآيات التي بنيت كلماتها من الحروف المختارة فقط.'}
                        {matchingMode === 'must_contain_all' && 'البحث عن الآيات التي اجتمعت فيها كافة الحروف المختارة سوياً في آية واحدة.'}
                        {matchingMode === 'zero_occurrences' && 'استخراج الآيات التي لم يرد فيها أي حرف من الحروف المحددة.'}
                    </p>
                </div>

                {/* Rule 2: Purity Threshold (if mode is purity) */}
                {matchingMode === 'pure_or_purity' ? (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary block">
                            عتبة النقاوة الحرفية:
                        </label>
                        <select
                            value={purityThreshold}
                            onChange={(e) => setPurityThreshold(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="100">نقاوة خالصة 100% (حصراً دون أي حرف دخيل)</option>
                            <option value="90">نقاوة فائقة (≥ 90%)</option>
                            <option value="80">نقاوة عالية (≥ 80%)</option>
                            <option value="70">نقاوة جيدة (≥ 70%)</option>
                            <option value="60">نقاوة متوسطة (≥ 60%)</option>
                            <option value="50">أغلبية حرفية (≥ 50%)</option>
                        </select>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                            تحديد أدنى نسبة مئوية للحروف المختارة من إجمالي حروف الآية.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary block">
                            الفواتح المقطعة:
                        </label>
                        <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-subtle border border-border-default cursor-pointer text-xs font-semibold text-text-secondary">
                            <input
                                type="checkbox"
                                checked={excludeFawatih}
                                onChange={(e) => setExcludeFawatih(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                            />
                            <span>استثناء فواتح السور المقطعة (الم، طه...)</span>
                        </label>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                            للتركيز على الآيات ذات التراكيب والعبارات اللغوية.
                        </p>
                    </div>
                )}

                {/* Rule 3: Surah Scope */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary block">
                        نطاق السور المفحوصة:
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={surahScope}
                            onChange={(e) => setSurahScope(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="all">المصحف كاملاً (114 سورة)</option>
                            <option value="fawatih_surahs">سور الفواتح المقطعة فقط (29 سورة)</option>
                            <option value="single_surah">سورة محددة بالاسم</option>
                        </select>

                        {surahScope === 'single_surah' && (
                            <select
                                value={selectedSurahNumber}
                                onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                                className="px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer shrink-0"
                            >
                                {QURAN_INDEX.map(s => (
                                    <option key={s.number} value={s.number}>
                                        {s.number}. سورة {s.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                        تحديد نطاق البحث في كامل القرآن أو حصرها في سور محددة.
                    </p>
                </div>
            </div>

            {/* Results Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1 rounded-2xl border border-border-default shadow-xs text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('ayahs')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'ayahs' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>قائمة الآيات المطابقة</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                            activeTab === 'ayahs' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                        }`}>
                            {filteredResults.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('frequencies')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'frequencies' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>توزيع الحروف والترددات</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('surahs')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'surahs' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>توزيع السور</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                            activeTab === 'surahs' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                        }`}>
                            {scanStats?.surahDistribution.length || 0}
                        </span>
                    </button>
                </div>

                {/* Secondary Search & View Mode Controls */}
                {activeTab === 'ayahs' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Text Search input */}
                        <div className="relative min-w-[180px] sm:min-w-[220px]">
                            <input
                                type="text"
                                value={localQuery}
                                onChange={(e) => {
                                    setLocalQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="بحث في النتائج..."
                                className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs text-text-primary focus:outline-hidden focus:border-primary shadow-xs"
                            />
                            {localQuery && (
                                <button
                                    onClick={() => setLocalQuery('')}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                >
                                    <ClearIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Display Word Mode */}
                        <div className="inline-flex items-center gap-1 bg-surface p-0.5 rounded-xl border border-border-default shadow-xs">
                            <button
                                onClick={() => setDisplayMode('words')}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                    displayMode === 'words' ? 'bg-primary text-white' : 'text-text-muted'
                                }`}
                            >
                                تفكيك الكلمات
                            </button>
                            <button
                                onClick={() => setDisplayMode('text')}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                    displayMode === 'text' ? 'bg-primary text-white' : 'text-text-muted'
                                }`}
                            >
                                نص متصل
                            </button>
                        </div>

                        {/* Page Size Selector */}
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold text-text-secondary focus:outline-hidden focus:border-primary cursor-pointer shadow-xs"
                        >
                            <option value="20">20 آية / صفحة</option>
                            <option value="50">50 آية / صفحة</option>
                            <option value="100">100 آية / صفحة</option>
                            <option value="0">عرض كافة النتائج ({filteredResults.length})</option>
                        </select>

                        {/* Copy All Button */}
                        <button
                            onClick={handleCopyAllResults}
                            disabled={filteredResults.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
                        >
                            {copiedAll ? (
                                <>
                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-500 font-bold">تم النسخ!</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-3.5 h-3.5" />
                                    <span>نسخ الكل</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* TAB 1: Ayahs Cards List */}
            {activeTab === 'ayahs' && (
                <div className="space-y-4">
                    {paginatedResults.length === 0 ? (
                        <div className="p-12 text-center bg-surface rounded-3xl border border-border-default text-text-muted space-y-3">
                            <SparklesIcon className="w-10 h-10 mx-auto opacity-30 text-purple-500" />
                            <div className="font-bold text-base text-text-primary">
                                {progressState.isScanning ? 'جاري فحص آيات القرآن الكريم...' : 'لا توجد آيات مطابقة للتركيبة المحددة'}
                            </div>
                            <p className="text-xs text-text-muted max-w-md mx-auto">
                                {progressState.isScanning ? 'يرجى الانتظار ريثما تنتهي عملية الفحص أو انقر على زر الإيقاف.' : 'جرب خفض عتبة النقاوة أو إضافة حروف أخرى إلى المصفوفة أو تغيير نمط المطابقة.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paginatedResults.map(item => {
                                const ayahKey = `${item.surahNumber}:${item.ayahNumberInSurah}`;
                                const isCopied = copiedAyahKey === ayahKey;
                                const isSaved = !!savedAyahMap[ayahKey];
                                const isPlaying = currentlyPlayingAyahGlobalNumber === item.ayahNumberGlobal;
                                const displayText = getDisplayText(item.surahNumber, item.ayahNumberInSurah, item.textOriginal);

                                return (
                                    <div
                                        key={ayahKey}
                                        className="p-4 sm:p-5 rounded-3xl bg-surface border border-border-default hover:border-purple-300 dark:hover:border-purple-700/60 transition-all shadow-xs space-y-3"
                                    >
                                        {/* Card Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-default/50">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs">
                                                    سورة {item.surahName} : الآية {item.ayahNumberInSurah}
                                                </span>
                                                <span className="text-[11px] text-text-muted">
                                                    (الرقم العام: {item.ayahNumberGlobal})
                                                </span>
                                                {item.isFawatihAyah && (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                                                        فاتحة مقطعة
                                                    </span>
                                                )}
                                            </div>

                                            {/* Metrics Pill */}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    item.isPure
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                }`}>
                                                    {item.isPure ? '✨ 100% نقاوة خالصة' : `نقاوة: ${item.purityPercentage}%`}
                                                </span>
                                                <span className="text-xs text-text-muted font-mono">
                                                    ({item.matchedLettersCount} / {item.totalLetters} حرفاً)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ayah Text / Word Breakdown */}
                                        {displayMode === 'words' ? (
                                            <div className="flex flex-wrap gap-2 pt-1 leading-loose" dir="rtl">
                                                {item.words.map((w, wIdx) => (
                                                    <span
                                                        key={wIdx}
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-xl text-base sm:text-lg font-quran transition-colors ${
                                                            w.isMatched
                                                                ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border border-emerald-500/20 font-bold'
                                                                : 'bg-surface-subtle text-text-secondary border border-border-default/50'
                                                        }`}
                                                        title={w.isMatched ? 'كلمة مطابقة بالكامل للمصفوفة' : `حروف غير مطابقة: ${w.unmatchedLetters.join('، ')}`}
                                                    >
                                                        {w.wordOriginal}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="font-quran text-lg sm:text-xl text-text-primary leading-loose pt-1" dir="rtl">
                                                {displayText}
                                            </div>
                                        )}

                                        {/* Unmatched Letters Note if not 100% */}
                                        {!item.isPure && item.unmatchedLettersInAyah.length > 0 && (
                                            <div className="text-[11px] text-text-muted flex items-center gap-1.5 pt-1">
                                                <span className="font-semibold">الحروف الدخيلة في الآية:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.unmatchedLettersInAyah.map((ch, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs">
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-default/40 text-xs">
                                            <a
                                                href={`#/surah/${item.surahNumber}?ayah=${item.ayahNumberInSurah}`}
                                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
                                            >
                                                <span>قراءة في المصحف</span>
                                                <ArrowRightIcon className="w-3.5 h-3.5" />
                                            </a>

                                            <div className="flex items-center gap-2">
                                                {onStartPlayback && (
                                                    <button
                                                        onClick={() => onStartPlayback([{ number: item.ayahNumberGlobal, numberInSurah: item.ayahNumberInSurah, text: item.textOriginal, audio: '', audioSecondary: [] } as any], 'ar.alafasy')}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                                            isPlaying
                                                                ? 'bg-primary text-white border-primary'
                                                                : 'bg-surface-subtle hover:bg-surface-hover border-border-default text-text-secondary hover:text-primary'
                                                        }`}
                                                    >
                                                        <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">{isPlaying ? 'تشغيل...' : 'استماع'}</span>
                                                    </button>
                                                )}

                                                {onSaveAyah && (
                                                    <button
                                                        onClick={() => handleSaveSingle(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        {isSaved ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <BookOpenIcon className="w-3.5 h-3.5" />}
                                                        <span className="hidden sm:inline">{isSaved ? 'تم الحفظ' : 'حفظ بالدفتر'}</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleCopySingle(item)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                                    <span className="hidden sm:inline">{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {pageSize > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                            >
                                السابق
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                currentPage === pageNum
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-hover border border-border-default text-text-secondary'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Letter Frequencies Distribution */}
            {activeTab === 'frequencies' && (
                <div className="p-4 sm:p-6 bg-surface rounded-3xl border border-border-default shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-text-primary">
                            تكرار وتردد كل حرف داخل الآيات المطابقة
                        </h3>
                        <p className="text-xs text-text-muted">
                            رسم بياني لتوزيع الأحرف وترددها التراكمي في الآيات التي حققت شرط التصفية.
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        {ARABIC_LETTERS_META.filter(m => selectedLetters.includes(m.char)).map(meta => {
                            const count = scanStats?.letterFrequencyInMatched[meta.char] || 0;
                            const maxFreq = Math.max(...Object.values(scanStats?.letterFrequencyInMatched || {}), 1);
                            const percent = Math.round((count / maxFreq) * 100);

                            return (
                                <div key={meta.char} className="flex items-center gap-3 text-xs">
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-quran text-lg font-bold flex items-center justify-center shrink-0">
                                        {meta.char}
                                    </div>
                                    <div className="w-14 font-semibold text-text-primary shrink-0">
                                        {meta.name}
                                    </div>
                                    <div className="flex-1 h-4 bg-surface-subtle rounded-full overflow-hidden border border-border-default/50">
                                        <div 
                                            className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <div className="w-20 text-left font-mono font-bold text-text-primary shrink-0">
                                        {count.toLocaleString()} <span className="text-[10px] text-text-muted font-normal">مرة</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: Surah Distribution */}
            {activeTab === 'surahs' && (
                <div className="p-4 sm:p-6 bg-surface rounded-3xl border border-border-default shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-text-primary">
                            توزيع الآيات المطابقة على سور القرآن الكريم
                        </h3>
                        <p className="text-xs text-text-muted">
                            قائمة بالسور التي ظهرت فيها الآيات المطابقة مرتبة حسب الأكثر احتواءً.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {scanStats?.surahDistribution.map(s => {
                            const ratio = Math.round((s.matchCount / s.totalAyahs) * 100);
                            return (
                                <div 
                                    key={s.surahNumber}
                                    className="p-3.5 rounded-2xl bg-surface-subtle border border-border-default flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-lg bg-surface border border-border-default flex items-center justify-center text-xs font-bold text-text-muted">
                                            {s.surahNumber}
                                        </span>
                                        <div>
                                            <div className="font-bold text-xs sm:text-sm text-text-primary">
                                                سورة {s.surahName}
                                            </div>
                                            <div className="text-[11px] text-text-muted">
                                                {s.matchCount} من أصل {s.totalAyahs} آية ({ratio}%)
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={`#/surah/${s.surahNumber}`}
                                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-colors"
                                        title="فتح السورة"
                                    >
                                        <ArrowRightIcon className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalAlphabetMatrixView;
