import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData, SavedAyahItem } from '../types';
import { 
    scanQuranNoorani, 
    PURE_NOORANI_LETTERS, 
    NOORANI_LETTERS_WITH_WAW, 
    ALL_ARABIC_LETTERS_ORDERED,
    NOORANI_MNEMONICS,
    FAWATIH_SURAHS_NUMBERS,
    HAWAMIM_SURAHS_NUMBERS,
    HAWAMIM_LETTERS,
    HAWAMIM_LETTERS_WITH_WAW,
    normalizeCharForNoorani,
    AyahNooraniAnalysis
} from '../utils/nooraniAyahs';
import { NooraniAyahCard } from './noorani/NooraniAyahCard';
import { NooraniLetterMatrix } from './noorani/NooraniLetterMatrix';
import { NooraniSequencesTab } from './noorani/NooraniSequencesTab';
import { QURAN_INDEX } from '../quranIndex';
import { 
    SparklesIcon, 
    BookOpenIcon, 
    SearchIcon, 
    ClearIcon, 
    InformationCircleIcon, 
    CopyIcon, 
    CheckIcon,
    ArrowRightIcon,
    SpeakerWaveIcon
} from './icons';

export type NooraniSortOrder = 'quran_order' | 'purity_desc' | 'longest_streak' | 'letters_desc' | 'letters_asc';

interface NooraniAyahsViewProps {
    simpleCleanData: SurahData[];
    displayEditionData?: SurahData[];
    onSaveAyah?: (item: SavedAyahItem) => void;
    onStartPlayback?: (ayahs: any[], audioEditionIdentifier: string, startIndex?: number) => void;
    currentlyPlayingAyahGlobalNumber?: number | null;
}

const NooraniAyahsView: React.FC<NooraniAyahsViewProps> = ({
    simpleCleanData,
    onSaveAyah,
    onStartPlayback,
    currentlyPlayingAyahGlobalNumber = null
}) => {
    // Top-level View / Mode Tab
    const [activeTab, setActiveTab] = useState<'ayahs' | 'sequences' | 'matrix' | 'about'>('ayahs');

    // The Core Feature: Waw (و) Toggle
    const [allowWaw, setAllowWaw] = useState<boolean>(false);

    // Filter Options
    const [purityThreshold, setPurityThreshold] = useState<number>(100); // 100 = 100% pure only
    const [excludeFawatih, setExcludeFawatih] = useState<boolean>(false);
    const [surahScope, setSurahScope] = useState<'all' | 'fawatih_surahs' | 'hawamim_surahs' | 'meccan' | 'medinan'>('all');
    const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | undefined>(undefined);
    const [displayWordMode, setDisplayWordMode] = useState<'text' | 'words'>('text');
    const [filterQuery, setFilterQuery] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<NooraniSortOrder>('quran_order');

    // Custom Letters Matrix State
    const [customLetters, setCustomLetters] = useState<string[]>(PURE_NOORANI_LETTERS);
    const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
    const [matrixPage, setMatrixPage] = useState<number>(1);
    const [matrixPageSize, setMatrixPageSize] = useState<number>(20);
    const [matrixDisplayMode, setMatrixDisplayMode] = useState<'words' | 'text'>('words');
    const [matrixFilterQuery, setMatrixFilterQuery] = useState<string>('');

    // Pagination for Ayahs Tab
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 20;

    // Toast / feedback
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedMatrixAll, setCopiedMatrixAll] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Synchronize customLetters when allowWaw changes unless user made custom individual selections
    const handleToggleWaw = (wawAllowed: boolean) => {
        setAllowWaw(wawAllowed);
        setIsCustomMode(false);
        setCustomLetters(wawAllowed ? NOORANI_LETTERS_WITH_WAW : PURE_NOORANI_LETTERS);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleResetToPure = () => {
        setAllowWaw(false);
        setIsCustomMode(false);
        setCustomLetters(PURE_NOORANI_LETTERS);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleResetWithWaw = () => {
        setAllowWaw(true);
        setIsCustomMode(false);
        setCustomLetters(NOORANI_LETTERS_WITH_WAW);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleSelectAllLetters = () => {
        setIsCustomMode(true);
        setCustomLetters(ALL_ARABIC_LETTERS_ORDERED);
        setAllowWaw(true);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleClearAllLetters = () => {
        setIsCustomMode(true);
        setCustomLetters([]);
        setAllowWaw(false);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    // Quick Hawamim Letters & Surahs selection
    const handleSelectHawamimOnly = () => {
        setIsCustomMode(true);
        setCustomLetters(HAWAMIM_LETTERS);
        setAllowWaw(false);
        setSurahScope('hawamim_surahs');
        setSelectedSurahNumber(undefined);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleSelectHawamimSurahsScope = () => {
        setSurahScope('hawamim_surahs');
        setSelectedSurahNumber(undefined);
        setCurrentPage(1);
        setMatrixPage(1);
    };

    const handleToggleSingleLetter = (letter: string) => {
        setIsCustomMode(true);
        const norm = normalizeCharForNoorani(letter);
        setCustomLetters(prev => {
            const set = new Set(prev.map(normalizeCharForNoorani));
            if (set.has(norm)) {
                set.delete(norm);
            } else {
                set.add(norm);
            }
            const nextList = Array.from(set);
            // Check if Waw state matches
            setAllowWaw(set.has('و'));
            return nextList;
        });
        setCurrentPage(1);
        setMatrixPage(1);
    };

    // Scan execution
    const scanData = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) {
            return { results: [], stats: { totalAyahsScanned: 0, pureAyahsCount: 0, highDensityAyahsCount: 0, mediumDensityAyahsCount: 0, totalNooraniLettersInQuran: 0, totalLettersInQuran: 0, overallNooraniPercentage: 0, letterFrequencyInMatched: {}, surahDistribution: [] } };
        }

        return scanQuranNoorani(simpleCleanData, {
            allowWaw,
            purityThreshold,
            excludeFawatih,
            surahNumber: selectedSurahNumber,
            surahScope,
            customAllowedLetters: isCustomMode ? customLetters : undefined
        });
    }, [simpleCleanData, allowWaw, purityThreshold, excludeFawatih, selectedSurahNumber, surahScope, isCustomMode, customLetters]);

    // Sorting Helper
    const sortAyahs = (list: AyahNooraniAnalysis[], order: NooraniSortOrder): AyahNooraniAnalysis[] => {
        const copy = [...list];
        switch (order) {
            case 'quran_order':
                return copy.sort((a, b) => a.ayahNumberGlobal - b.ayahNumberGlobal);
            case 'purity_desc':
                return copy.sort((a, b) => {
                    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
                    return a.ayahNumberGlobal - b.ayahNumberGlobal;
                });
            case 'longest_streak':
                return copy.sort((a, b) => {
                    if (b.longestNooraniWordStreak.length !== a.longestNooraniWordStreak.length) {
                        return b.longestNooraniWordStreak.length - a.longestNooraniWordStreak.length;
                    }
                    return a.ayahNumberGlobal - b.ayahNumberGlobal;
                });
            case 'letters_desc':
                return copy.sort((a, b) => {
                    if (b.totalLetters !== a.totalLetters) return b.totalLetters - a.totalLetters;
                    return a.ayahNumberGlobal - b.ayahNumberGlobal;
                });
            case 'letters_asc':
                return copy.sort((a, b) => {
                    if (a.totalLetters !== b.totalLetters) return a.totalLetters - b.totalLetters;
                    return a.ayahNumberGlobal - b.ayahNumberGlobal;
                });
            default:
                return copy;
        }
    };

    // Local Text Filter & Sort for Ayahs Tab
    const filteredResults = useMemo(() => {
        let list = scanData.results;
        if (filterQuery.trim()) {
            const q = filterQuery.trim().toLowerCase();
            list = list.filter(r => 
                r.textNormalized.includes(q) || 
                r.surahName.includes(q) || 
                r.textOriginal.includes(q)
            );
        }
        return sortAyahs(list, sortOrder);
    }, [scanData.results, filterQuery, sortOrder]);

    // Paginated results for Ayahs Tab
    const totalPages = Math.ceil(filteredResults.length / pageSize);
    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredResults.slice(start, start + pageSize);
    }, [filteredResults, currentPage]);

    // Copy all matching ayahs in Ayahs Tab
    const handleCopyAll = () => {
        const text = filteredResults.map(r => `${r.textOriginal} [سورة ${r.surahName}: ${r.ayahNumberInSurah}]`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
    };

    // Local Text Filter & Sort for Matrix Tab
    const filteredMatrixResults = useMemo(() => {
        let list = scanData.results;
        if (matrixFilterQuery.trim()) {
            const q = matrixFilterQuery.trim().toLowerCase();
            list = list.filter(r => 
                r.textNormalized.includes(q) || 
                r.surahName.includes(q) || 
                r.textOriginal.includes(q)
            );
        }
        return sortAyahs(list, sortOrder);
    }, [scanData.results, matrixFilterQuery, sortOrder]);

    // Paginated results for Matrix Tab
    const totalMatrixPages = matrixPageSize > 0 ? Math.ceil(filteredMatrixResults.length / matrixPageSize) : 1;
    const paginatedMatrixResults = useMemo(() => {
        if (matrixPageSize === 0) return filteredMatrixResults;
        const start = (matrixPage - 1) * matrixPageSize;
        return filteredMatrixResults.slice(start, start + matrixPageSize);
    }, [filteredMatrixResults, matrixPage, matrixPageSize]);

    // Copy all matching ayahs in Matrix Tab
    const handleCopyMatrixAll = () => {
        const text = filteredMatrixResults.map(r => `${r.textOriginal} [سورة ${r.surahName}: ${r.ayahNumberInSurah}]`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedMatrixAll(true);
        setTimeout(() => setCopiedMatrixAll(false), 2500);
    };

    return (
        <div className="container mx-auto p-3 sm:p-6 lg:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border-default/60">
                <a 
                    href="#/structure" 
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>العودة إلى بنية المصحف</span>
                </a>

                {/* Mnemonic Pill */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-border-default text-xs text-text-secondary">
                    <span className="text-text-muted">الجامع للنورانية:</span>
                    <span className="font-bold text-primary font-quran">«نَصٌّ حَكِيمٌ قَاطِعٌ لَهُ سِرٌّ»</span>
                </div>
            </div>

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 p-5 sm:p-8 shadow-xs">
                <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30">
                        <SparklesIcon className="w-4 h-4" />
                        <span>الحروف النورانية الـ 14 وفواتح السور</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
                        الآيات النورانية
                    </h1>

                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                        مسح واستكشاف آيات القرآن الكريم المتشكلة حصراً أو بأعلى كثافة من <strong>الحروف النورانية الـ 14</strong> (فواتح السور)، مع تحكم مرن باعتبار <strong>حرف الواو (و)</strong> كحرف مسموح به في البنية النورانية.
                    </p>
                </div>

                {/* The Main Highlight: WAW Mode Toggle Card */}
                <div className="mt-6 p-4 rounded-2xl bg-surface/90 border border-border-default shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-text-muted">خيارات البنية النورانية وحرف الواو:</div>
                        <div className="text-sm font-semibold text-text-primary">
                            {allowWaw ? (
                                <span className="text-sky-600 dark:text-sky-400 font-bold">
                                    النمط الموسع (+و): السماح بحرف الواو (15 حرفاً مسموحاً)
                                </span>
                            ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    النمط الصافي: الحروف النورانية الـ 14 فقط (بدون حرف الواو)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quick Mode Switcher */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleToggleWaw(false)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                !allowWaw
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default'
                            }`}
                        >
                            {!allowWaw && <CheckIcon className="w-4 h-4" />}
                            <span>بدون الواو (14 حرفاً)</span>
                        </button>

                        <button
                            onClick={() => handleToggleWaw(true)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                allowWaw
                                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/30'
                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default'
                            }`}
                        >
                            {allowWaw && <CheckIcon className="w-4 h-4" />}
                            <span>+ حرف الواو (15 حرفاً)</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* View Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border-default">
                <button
                    onClick={() => setActiveTab('ayahs')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'ayahs'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>الآيات الممسوحة ({filteredResults.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('sequences')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'sequences'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>أطول العبارات النورانية</span>
                </button>

                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'matrix'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                >
                    <span>مصفوفة الحروف الـ 28</span>
                </button>

                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'about'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                >
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>فلسفة الحروف النورانية</span>
                </button>
            </div>

            {/* TAB 1: AYAHS LIST & FILTERS */}
            {activeTab === 'ayahs' && (
                <div className="space-y-6">
                    {/* Summary Stats Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1">
                            <div className="text-xs text-text-muted font-medium">الآيات النورانية الخالصة (100%)</div>
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {scanData.stats.pureAyahsCount} <span className="text-xs font-normal text-text-secondary">آية</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1">
                            <div className="text-xs text-text-muted font-medium">آيات فائقة النورانية (≥90%)</div>
                            <div className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400">
                                {scanData.stats.highDensityAyahsCount} <span className="text-xs font-normal text-text-secondary">آية</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1">
                            <div className="text-xs text-text-muted font-medium">إجمالي الحروف النورانية بالقرآن</div>
                            <div className="text-xl sm:text-2xl font-bold text-primary">
                                {scanData.stats.overallNooraniPercentage}% <span className="text-xs font-normal text-text-secondary">من أحرف القرآن</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1">
                            <div className="text-xs text-text-muted font-medium">أعلى السور احتواءً</div>
                            <div className="text-sm sm:text-base font-bold text-text-primary truncate">
                                {scanData.stats.surahDistribution[0] ? `سورة ${scanData.stats.surahDistribution[0].surahName} (${scanData.stats.surahDistribution[0].count})` : '—'}
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-default shadow-xs space-y-4">
                        {/* Quick Filter & Scope Pills */}
                        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border-default/60">
                            <span className="text-xs font-bold text-text-muted">فلاتر سريعة:</span>
                            
                            {/* Quran Order Pill */}
                            <button
                                onClick={() => setSortOrder('quran_order')}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    sortOrder === 'quran_order'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                                }`}
                                title="عرض الآيات مرتبة كما وردت في المصحف الشريف سورة بسورة وآية بآية"
                            >
                                <BookOpenIcon className="w-3.5 h-3.5" />
                                <span>ترتيب المصحف الشريف</span>
                                {sortOrder === 'quran_order' && <CheckIcon className="w-3 h-3" />}
                            </button>

                            {/* Hawamim Ayahs in Hawamim Surahs Pill */}
                            <button
                                onClick={handleSelectHawamimOnly}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isCustomMode && customLetters.length === 2 && customLetters.includes('ح') && customLetters.includes('م') && surahScope === 'hawamim_surahs'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                }`}
                                title="عرض آيات الحواميم المتشكلة من (ح، م) في سور آل حم السبعة فقط (40 إلى 46)"
                            >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>آيات الحواميم في سور الحواميم (40-46)</span>
                                {isCustomMode && customLetters.length === 2 && customLetters.includes('ح') && customLetters.includes('م') && surahScope === 'hawamim_surahs' && (
                                    <CheckIcon className="w-3 h-3" />
                                )}
                            </button>

                            {/* Hawamim Surahs Scope Pill */}
                            <button
                                onClick={handleSelectHawamimSurahsScope}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    surahScope === 'hawamim_surahs' && (!isCustomMode || customLetters.length > 2)
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                                }`}
                                title="حصر البحث في سور آل حم السبعة فقط (غافر، فصلت، الشورى، الزخرف، الدخان، الجاثية، الأحقاف)"
                            >
                                <span>سور الحواميم فقط (40 - 46)</span>
                                {surahScope === 'hawamim_surahs' && (!isCustomMode || customLetters.length > 2) && (
                                    <CheckIcon className="w-3 h-3" />
                                )}
                            </button>

                            {/* Reset to Pure 14 */}
                            <button
                                onClick={handleResetToPure}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    !allowWaw && !isCustomMode && surahScope === 'all'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-surface-subtle hover:bg-surface-hover text-text-muted border border-border-default'
                                }`}
                            >
                                <span>النمط الصافي (14 حرفاً)</span>
                            </button>
                        </div>

                        {/* Dropdown Filters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* Sort Order Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                                    ترتيب العرض (الفرز):
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as NooraniSortOrder);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value="quran_order">📖 حسب ترتيب المصحف الشريف</option>
                                    <option value="purity_desc">🌟 أعلى نسبة نقاوة نورانية</option>
                                    <option value="longest_streak">✨ أطول تتابع كلمات نورانية</option>
                                    <option value="letters_desc">📏 حسب طول الآية (الأطول أولاً)</option>
                                    <option value="letters_asc">📐 حسب طول الآية (الأقصر أولاً)</option>
                                </select>
                            </div>

                            {/* Purity Level */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                                    درجة النقاوة النورانية:
                                </label>
                                <select
                                    value={purityThreshold}
                                    onChange={(e) => {
                                        setPurityThreshold(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value={100}>🌟 100% نورانية خالصة تماماً</option>
                                    <option value={90}>✨ ≥ 90% (فائقة النورانية)</option>
                                    <option value={80}>💫 ≥ 80% (عالية النورانية)</option>
                                    <option value={0}>🔍 كافة الآيات مع النسبة</option>
                                </select>
                            </div>

                            {/* Surah Scope */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                                    نطاق السور:
                                </label>
                                <select
                                    value={surahScope}
                                    onChange={(e) => {
                                        setSurahScope(e.target.value as any);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value="all">كافة سور المصحف الشريف (114 سورة)</option>
                                    <option value="hawamim_surahs">سور الحواميم السبعة فقط (غافر 40 إلى الأحقاف 46)</option>
                                    <option value="fawatih_surahs">السور ذات الفواتح النورانية فقط (29 سورة)</option>
                                    <option value="meccan">السور المكية فقط</option>
                                    <option value="medinan">السور المدنية فقط</option>
                                </select>
                            </div>

                            {/* Specific Surah */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                                    تحديد سورة معينة:
                                </label>
                                <select
                                    value={selectedSurahNumber || ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : undefined;
                                        setSelectedSurahNumber(val);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value="">جميع السور في النطاق المحدد</option>
                                    {QURAN_INDEX.map(s => (
                                        <option key={s.number} value={s.number}>
                                            {s.number}. سورة {s.name.replace(/سُورَةُ\s*/g, '')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Filter text */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                                    تصفية بنص أو كلمة:
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={filterQuery}
                                        onChange={(e) => {
                                            setFilterQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="ابحث في النتائج..."
                                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs text-text-primary focus:outline-hidden focus:border-primary"
                                    />
                                    {filterQuery && (
                                        <button
                                            onClick={() => setFilterQuery('')}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                        >
                                            <ClearIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Extra controls row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default/60 text-xs">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                {/* Exclude Fawatih toggle */}
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={excludeFawatih}
                                        onChange={(e) => {
                                            setExcludeFawatih(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                        className="rounded-md border-border-default text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span>استثناء فواتح السور المقطعة (الم، طه، يس...) للتركيز على الجمل</span>
                                </label>

                                {/* Display Word mode */}
                                <div className="inline-flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border-default">
                                    <button
                                        onClick={() => setDisplayWordMode('text')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            displayWordMode === 'text' ? 'bg-primary text-white' : 'text-text-muted'
                                        }`}
                                    >
                                        نص متصل
                                    </button>
                                    <button
                                        onClick={() => setDisplayWordMode('words')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            displayWordMode === 'words' ? 'bg-primary text-white' : 'text-text-muted'
                                        }`}
                                    >
                                        تحليل الكلمات
                                    </button>
                                </div>
                            </div>

                            {/* Copy all button */}
                            {filteredResults.length > 0 && (
                                <button
                                    onClick={handleCopyAll}
                                    className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    {copiedAll ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    <span>{copiedAll ? 'تم نسخ جميع النتائج' : 'نسخ كل الآيات المطابقة'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Counter */}
                    <div className="flex items-center justify-between text-xs text-text-muted px-1">
                        <span>
                            عرض <strong className="text-text-primary">{filteredResults.length}</strong> آية مطابقة للمعايير الحالية
                        </span>
                        {totalPages > 1 && (
                            <span>
                                صفحة {currentPage} من {totalPages}
                            </span>
                        )}
                    </div>

                    {/* Results List */}
                    {filteredResults.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-surface border border-border-default space-y-3">
                            <SparklesIcon className="w-10 h-10 mx-auto text-text-muted" />
                            <h3 className="text-base font-bold text-text-primary">لم يتم العثور على آيات مطابقة</h3>
                            <p className="text-xs text-text-secondary max-w-md mx-auto">
                                جرب تخفيض نسبة النقاوة النورانية، أو تفعيل خيار + حرف الواو (و)، أو توسيع نطاق السور.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedResults.map((item) => (
                                <NooraniAyahCard
                                    key={`${item.surahNumber}:${item.ayahNumberInSurah}`}
                                    item={item}
                                    onSaveAyah={onSaveAyah}
                                    onPlayAyah={onStartPlayback ? () => onStartPlayback([item as any], 'ar.alafasy') : undefined}
                                    isPlaying={currentlyPlayingAyahGlobalNumber === item.ayahNumberGlobal}
                                    displayMode={displayWordMode}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
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

            {/* TAB 2: SEQUENCES TAB */}
            {activeTab === 'sequences' && (
                <NooraniSequencesTab 
                    quranData={simpleCleanData}
                    allowWaw={allowWaw}
                    onSaveAyah={onSaveAyah}
                />
            )}

            {/* TAB 3: LETTER MATRIX TAB */}
            {activeTab === 'matrix' && (
                <div className="space-y-6">
                    <NooraniLetterMatrix
                        allowedLetters={customLetters}
                        onToggleLetter={handleToggleSingleLetter}
                        onResetToPure={handleResetToPure}
                        onResetWithWaw={handleResetWithWaw}
                        onSelectAll={handleSelectAllLetters}
                        onClearAll={handleClearAllLetters}
                        onSelectHawamim={handleSelectHawamimOnly}
                        letterFrequencies={scanData.stats.letterFrequencyInMatched}
                        allowWaw={allowWaw}
                        onToggleWaw={handleToggleWaw}
                    />

                    {/* Active Scan Results with the Matrix */}
                    <div className="space-y-4">
                        {/* Matrix Filter & Controls Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-surface rounded-2xl border border-border-default shadow-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base text-text-primary">
                                    الآيات المطابقة للمصفوفة المخصصة:
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                                    {filteredMatrixResults.length} آية
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Sort selector for Matrix */}
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as NooraniSortOrder);
                                        setMatrixPage(1);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-secondary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value="quran_order">📖 ترتيب المصحف</option>
                                    <option value="purity_desc">🌟 أعلى نقاوة</option>
                                    <option value="longest_streak">✨ أطول تتابع</option>
                                    <option value="letters_desc">📏 الأطول حروفاً</option>
                                    <option value="letters_asc">📐 الأقصر حروفاً</option>
                                </select>

                                {/* Matrix Filter input */}
                                <div className="relative min-w-[160px] sm:min-w-[200px]">
                                    <input
                                        type="text"
                                        value={matrixFilterQuery}
                                        onChange={(e) => {
                                            setMatrixFilterQuery(e.target.value);
                                            setMatrixPage(1);
                                        }}
                                        placeholder="بحث في النتائج..."
                                        className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-surface-subtle border border-border-default text-xs text-text-primary focus:outline-hidden focus:border-primary"
                                    />
                                    {matrixFilterQuery && (
                                        <button
                                            onClick={() => setMatrixFilterQuery('')}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                        >
                                            <ClearIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Display Word Mode */}
                                <div className="inline-flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border-default">
                                    <button
                                        onClick={() => setMatrixDisplayMode('words')}
                                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            matrixDisplayMode === 'words' ? 'bg-primary text-white' : 'text-text-muted'
                                        }`}
                                    >
                                        تحليل الكلمات
                                    </button>
                                    <button
                                        onClick={() => setMatrixDisplayMode('text')}
                                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            matrixDisplayMode === 'text' ? 'bg-primary text-white' : 'text-text-muted'
                                        }`}
                                    >
                                        نص متصل
                                    </button>
                                </div>

                                {/* Page Size Selector */}
                                <select
                                    value={matrixPageSize}
                                    onChange={(e) => {
                                        setMatrixPageSize(Number(e.target.value));
                                        setMatrixPage(1);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-surface-subtle border border-border-default text-xs font-semibold text-text-secondary focus:outline-hidden focus:border-primary cursor-pointer"
                                >
                                    <option value="20">20 آية / صفحة</option>
                                    <option value="50">50 آية / صفحة</option>
                                    <option value="0">عرض كافة النتائج ({filteredMatrixResults.length})</option>
                                </select>

                                {/* Copy All */}
                                <button
                                    onClick={handleCopyMatrixAll}
                                    disabled={filteredMatrixResults.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40"
                                >
                                    {copiedMatrixAll ? (
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
                        </div>

                        {/* Cards List */}
                        {paginatedMatrixResults.length === 0 ? (
                            <div className="p-12 text-center bg-surface rounded-3xl border border-border-default text-text-muted space-y-2">
                                <SparklesIcon className="w-8 h-8 mx-auto opacity-40" />
                                <div className="font-bold text-sm">لا توجد آيات مطابقة للتركيبة الحالية للحروف</div>
                                <div className="text-xs">جرب تفعيل المزيد من الحروف أو إعادة ضبط المصفوفة إلى النمط الصافي.</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedMatrixResults.map(item => (
                                    <NooraniAyahCard
                                        key={`${item.surahNumber}:${item.ayahNumberInSurah}`}
                                        item={item}
                                        onSaveAyah={onSaveAyah}
                                        onPlayAyah={onStartPlayback ? () => onStartPlayback([item as any], 'ar.alafasy') : undefined}
                                        isPlaying={currentlyPlayingAyahGlobalNumber === item.ayahNumberGlobal}
                                        displayMode={matrixDisplayMode}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination for Matrix Tab */}
                        {matrixPageSize > 0 && totalMatrixPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                    onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                                    disabled={matrixPage === 1}
                                    className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                                >
                                    السابق
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalMatrixPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalMatrixPages > 5 && matrixPage > 3) {
                                            pageNum = Math.min(totalMatrixPages - 4 + i, matrixPage - 2 + i);
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setMatrixPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                    matrixPage === pageNum
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
                                    onClick={() => setMatrixPage(p => Math.min(totalMatrixPages, p + 1))}
                                    disabled={matrixPage === totalMatrixPages}
                                    className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: PHILOSOPHY & LINGUISTIC ABOUT */}
            {activeTab === 'about' && (
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-surface border border-border-default shadow-xs space-y-5">
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <InformationCircleIcon className="w-6 h-6 text-primary" />
                            <span>فلسفة الحروف النورانية والآيات النورانية</span>
                        </h2>

                        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                            <p>
                                <strong>الحروف النورانية</strong> هي الحروف المقطعة الـ 14 التي افتتحت بها 29 سورة من سور القرآن الكريم. وتُمثّل نصف عدد حروف المعجم العربي (14 من أصل 28 حرفاً).
                            </p>

                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
                                <h3 className="font-bold text-sm mb-2 text-emerald-800 dark:text-emerald-300">العبارات الجامعة للحروف النورانية:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {NOORANI_MNEMONICS.map((m, idx) => (
                                        <div key={idx} className="p-2.5 bg-surface/80 rounded-xl border border-emerald-500/30">
                                            <div className="font-bold font-quran text-base">{m.title}</div>
                                            <div className="text-[11px] text-text-muted mt-0.5 tracking-wider">{m.letters}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-text-primary pt-2">
                                لماذا تمايز بين "بدون الواو" و"مع حرف الواو"؟
                            </h3>
                            <ul className="list-disc list-inside space-y-2 pr-2">
                                <li>
                                    <strong>النمط النوراني الصافي (14 حرفاً)</strong>: يلتزم حصراً بالحروف الواردة في فواتح السور (ا، ل، م، ص، ر، ك، هـ، ي، ع، ط، س، ح، ق، ن).
                                </li>
                                <li>
                                    <strong>النمط الموسّع (+ حرف الواو)</strong>: يُعامل حرف <strong>الواو (و)</strong> كحرف صلة وعطف أصيل يربط الجمل القرآنية، ويتيح اكتشاف آيات ومقاطع تركيبية كاملة من الحروف النورانية مثل "وَاللَّهُ يَعْلَمُ" وغيرها.
                                </li>
                            </ul>

                            <h3 className="text-base font-bold text-text-primary pt-2">
                                السور النورانية الـ 29:
                            </h3>
                            <p className="text-xs text-text-muted">
                                البقرة، آل عمران، الأعراف، يونس، هود، يوسف، الرعد، إبراهيم، الحجر، مريم، طه، الشعراء، النمل، القصص، العنكبوت، الروم، لقمان، السجدة، يس، ص، غافر، فصلت، الشورى، الزخرف، الدخان، الجاثية، الأحقاف، ق، القلم.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NooraniAyahsView;
