import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData, Ayah } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { normalizeArabicText, stripDiacritics } from '../utils/text';
import { SparklesIcon, ChevronLeftIcon, BookOpenIcon } from './icons';

// Standard Chronological Revelation Order (1 to 114) mapped to Surah Number
// Based on the standard historical Quranic chronology (Tanzil / Mushaf Al-Azhar)
export const SURAH_REVELATION_ORDER: Record<number, number> = {
    1: 5,   2: 87,  3: 89,  4: 92,  5: 112, 6: 55,  7: 39,  8: 88,  9: 113, 10: 51,
    11: 52, 12: 53, 13: 96, 14: 72, 15: 54, 16: 70, 17: 50, 18: 69, 19: 44, 20: 45,
    21: 73, 22: 103, 23: 74, 24: 102, 25: 42, 26: 47, 27: 48, 28: 49, 29: 85, 30: 84,
    31: 57, 32: 75, 33: 90, 34: 58, 35: 43, 36: 41, 37: 56, 38: 38, 39: 59, 40: 60,
    41: 61, 42: 62, 43: 63, 44: 64, 45: 65, 46: 66, 47: 95, 48: 111, 49: 106, 50: 34,
    51: 67, 52: 76, 53: 23, 54: 37, 55: 97, 56: 46, 57: 94, 58: 105, 59: 101, 60: 91,
    61: 109, 62: 110, 63: 104, 64: 108, 65: 99, 66: 107, 67: 77, 68: 2,  69: 78, 70: 79,
    71: 71, 72: 40, 73: 3,  74: 4,  75: 31, 76: 98, 77: 33, 78: 80, 79: 81, 80: 24,
    81: 7,  82: 82, 83: 86, 84: 83, 85: 27, 86: 36, 87: 8,  88: 68, 89: 10, 90: 35,
    91: 26, 92: 9,  93: 11, 94: 12, 95: 28, 96: 1,  97: 25, 98: 100, 99: 93, 100: 14,
    101: 30, 102: 16, 103: 13, 104: 32, 105: 19, 106: 29, 107: 17, 108: 15, 109: 18, 110: 114,
    111: 6, 112: 22, 113: 20, 114: 21
};

// 29 Muqattaat Surahs and their opening letters
const MUQATTAAT_MAP: Record<number, string> = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر",
    15: "الر", 19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم",
    31: "الم", 32: "الم", 36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم",
    44: "حم", 45: "حم", 46: "حم", 50: "ق", 68: "ن"
};

// Curated keywords that unveil deep geometric and structural patterns
const SUGGESTED_KEYWORDS = [
    "الرحمة",
    "الحكمة",
    "الصبر",
    "الفرقان",
    "الكتاب",
    "النور",
    "الروح",
    "الميزان",
    "التقوى",
    "الحمد",
    "الجهاد",
    "الساعة",
    "الفرقان",
    "البرهان"
];

interface WordSurahGeometryViewProps {
    simpleCleanData: SurahData[];
    initialWord?: string;
    onSearch?: (query: string, sourceEdition?: string) => void;
}

interface SurahOccurStat {
    surahNumber: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    revelationType: 'Meccan' | 'Medinan';
    revelationOrder: number;
    muqattaat?: string;
    totalWords: number;
    matchesCount: number;
    densityPerThousand: number;
    ayahs: { numberInSurah: number; text: string }[];
}

export const WordSurahGeometryView: React.FC<WordSurahGeometryViewProps> = ({
    simpleCleanData = [],
    initialWord = 'الرحمة',
    onSearch
}) => {
    const [query, setQuery] = useState(initialWord);
    const [exactMatch, setExactMatch] = useState(false);
    const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'intervals' | 'chronology'>('overview');
    const [sortBy, setSortBy] = useState<'surah' | 'density' | 'count' | 'revelation'>('density');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Clean query text for comparison
    const normalizedQuery = useMemo(() => {
        return normalizeArabicText(query.trim());
    }, [query]);

    // Precalculate total word counts for all 114 surahs
    const surahWordTotals = useMemo(() => {
        const map = new Map<number, number>();
        if (!simpleCleanData || simpleCleanData.length === 0) {
            // Fallback estimation if simpleCleanData is still loading
            QURAN_INDEX.forEach(s => map.set(s.number, s.numberOfAyahs * 12));
            return map;
        }

        simpleCleanData.forEach(surah => {
            let words = 0;
            surah.ayahs.forEach(a => {
                const clean = stripDiacritics(a.text);
                words += clean.split(/\s+/).filter(Boolean).length;
            });
            map.set(surah.number, words || 1);
        });

        return map;
    }, [simpleCleanData]);

    // Analyze occurrences across all 114 surahs
    const analysis = useMemo(() => {
        if (!normalizedQuery) {
            return {
                stats: [] as SurahOccurStat[],
                allSurahDensity: new Map<number, number>(),
                totalOccurrences: 0,
                surahsCount: 0,
                centerOfGravity: 0,
                chronologicalCenterOfGravity: 0,
                peakSurah: null as SurahOccurStat | null,
                dispersionRate: 0,
                surahNumbersSum: 0,
                evenSurahsCount: 0,
                oddSurahsCount: 0,
                meccanCount: 0,
                medinanCount: 0,
                muqattaatCount: 0,
                intervals: [] as { from: number; to: number; delta: number }[]
            };
        }

        const stats: SurahOccurStat[] = [];
        const allSurahDensity = new Map<number, number>();
        let totalOccurrences = 0;

        for (let sNum = 1; sNum <= 114; sNum++) {
            const surahMeta = QURAN_INDEX[sNum - 1];
            const surahData = simpleCleanData.find(s => s.number === sNum);
            const totalWords = surahWordTotals.get(sNum) || 100;
            const matchingAyahs: { numberInSurah: number; text: string }[] = [];
            let matchesCount = 0;

            if (surahData && surahData.ayahs) {
                surahData.ayahs.forEach(ayah => {
                    const normAyah = normalizeArabicText(ayah.text);
                    let countInAyah = 0;

                    if (exactMatch) {
                        const words = normAyah.split(/\s+/).filter(Boolean);
                        words.forEach(w => {
                            if (w === normalizedQuery) countInAyah++;
                        });
                    } else {
                        // Count occurrences of substring or word
                        let pos = 0;
                        while ((pos = normAyah.indexOf(normalizedQuery, pos)) !== -1) {
                            countInAyah++;
                            pos += normalizedQuery.length;
                        }
                    }

                    if (countInAyah > 0) {
                        matchesCount += countInAyah;
                        matchingAyahs.push({
                            numberInSurah: ayah.numberInSurah,
                            text: ayah.text
                        });
                    }
                });
            }

            const density = (matchesCount / totalWords) * 1000;
            allSurahDensity.set(sNum, density);

            if (matchesCount > 0) {
                totalOccurrences += matchesCount;
                stats.push({
                    surahNumber: sNum,
                    name: surahMeta?.name || `سورة ${sNum}`,
                    englishName: surahMeta?.englishName || '',
                    numberOfAyahs: surahMeta?.numberOfAyahs || 0,
                    revelationType: (surahMeta?.revelationType as any) || 'Meccan',
                    revelationOrder: SURAH_REVELATION_ORDER[sNum] || sNum,
                    muqattaat: MUQATTAAT_MAP[sNum],
                    totalWords,
                    matchesCount,
                    densityPerThousand: parseFloat(density.toFixed(2)),
                    ayahs: matchingAyahs
                });
            }
        }

        const surahsCount = stats.length;

        // 1. Center of Gravity (مركز الثقل المصحفي)
        let centerOfGravity = 0;
        let chronologicalCenterOfGravity = 0;

        if (totalOccurrences > 0) {
            const sumWeightedSurahs = stats.reduce((acc, curr) => acc + curr.surahNumber * curr.matchesCount, 0);
            centerOfGravity = parseFloat((sumWeightedSurahs / totalOccurrences).toFixed(2));

            const sumWeightedChrono = stats.reduce((acc, curr) => acc + curr.revelationOrder * curr.matchesCount, 0);
            chronologicalCenterOfGravity = parseFloat((sumWeightedChrono / totalOccurrences).toFixed(2));
        }

        // 2. Peak Word Power (أعلى كثافة نسبية للسورة)
        let peakSurah: SurahOccurStat | null = null;
        if (stats.length > 0) {
            peakSurah = [...stats].sort((a, b) => b.densityPerThousand - a.densityPerThousand)[0];
        }

        // 3. Dispersion Rate
        const dispersionRate = parseFloat(((surahsCount / 114) * 100).toFixed(1));

        // 4. Numerical Geometry
        const surahNumbersSum = stats.reduce((acc, curr) => acc + curr.surahNumber, 0);
        const evenSurahsCount = stats.filter(s => s.surahNumber % 2 === 0).length;
        const oddSurahsCount = stats.filter(s => s.surahNumber % 2 !== 0).length;

        // Intervals between consecutive surahs
        const intervals: { from: number; to: number; delta: number }[] = [];
        for (let i = 1; i < stats.length; i++) {
            const prev = stats[i - 1].surahNumber;
            const curr = stats[i].surahNumber;
            intervals.push({
                from: prev,
                to: curr,
                delta: curr - prev
            });
        }

        // 5. Cohort stats
        const meccanCount = stats.filter(s => s.revelationType === 'Meccan').length;
        const medinanCount = stats.filter(s => s.revelationType === 'Medinan').length;
        const muqattaatCount = stats.filter(s => Boolean(s.muqattaat)).length;

        return {
            stats,
            allSurahDensity,
            totalOccurrences,
            surahsCount,
            centerOfGravity,
            chronologicalCenterOfGravity,
            peakSurah,
            dispersionRate,
            surahNumbersSum,
            evenSurahsCount,
            oddSurahsCount,
            meccanCount,
            medinanCount,
            muqattaatCount,
            intervals
        };
    }, [normalizedQuery, exactMatch, simpleCleanData, surahWordTotals]);

    // Sorted stats for table
    const sortedStats = useMemo(() => {
        const list = [...analysis.stats];
        list.sort((a, b) => {
            let diff = 0;
            if (sortBy === 'density') diff = a.densityPerThousand - b.densityPerThousand;
            else if (sortBy === 'count') diff = a.matchesCount - b.matchesCount;
            else if (sortBy === 'revelation') diff = a.revelationOrder - b.revelationOrder;
            else diff = a.surahNumber - b.surahNumber;

            return sortDirection === 'desc' ? -diff : diff;
        });
        return list;
    }, [analysis.stats, sortBy, sortDirection]);

    // Helper to get nearest surah to center of gravity
    const nearestCenterSurah = useMemo(() => {
        if (!analysis.centerOfGravity) return null;
        const nearestNum = Math.round(analysis.centerOfGravity);
        const meta = QURAN_INDEX[nearestNum - 1];
        return { number: nearestNum, name: meta?.name || `سورة ${nearestNum}` };
    }, [analysis.centerOfGravity]);

    // Active selected surah details
    const selectedSurahData = useMemo(() => {
        if (!selectedSurahNumber) return null;
        return analysis.stats.find(s => s.surahNumber === selectedSurahNumber) || null;
    }, [selectedSurahNumber, analysis.stats]);

    // Function to highlight search term in ayah
    const highlightWord = (text: string, term: string) => {
        if (!term) return text;
        const cleanTerm = normalizeArabicText(term);
        const words = text.split(/(\s+)/);
        return words.map((w, idx) => {
            const isMatch = exactMatch
                ? normalizeArabicText(w) === cleanTerm
                : normalizeArabicText(w).includes(cleanTerm);
            if (isMatch) {
                return (
                    <mark key={idx} className="bg-amber-300/80 dark:bg-amber-500/40 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded font-bold">
                        {w}
                    </mark>
                );
            }
            return w;
        });
    };

    return (
        <div className="container mx-auto p-3 sm:p-6 md:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border-default">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <a href="#/structure" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
                        <span>بنية المصحف الشريف</span>
                    </a>
                    <span className="text-border-default">/</span>
                    <span className="text-text-secondary font-semibold">مركز ثقل المفردة وهندسة السور</span>
                </div>

                <a
                    href="#/structure"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                    <ChevronLeftIcon className="w-4 h-4 transform rotate-180" />
                    <span>العودة لفهرس البنية</span>
                </a>
            </div>

            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    <span>⚖️ الهندسة الرياضية والبنائية للمفردات</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-primary font-amiri tracking-wide">
                    مركز ثقل المفردة وهندسة السور
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    استكشاف أسرار اختيار السور الحاضنة للكلمات القرآنية، قياس قوة الكلمة (كثافتها النوعية)، وتحديد مركز ثقلها المصحفي والمسافات البينية والتناظر العددي لأرقام السور.
                </p>
            </div>

            {/* Search Workbench & Chips */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-default shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedSurahNumber(null);
                            }}
                            placeholder="اكتب أي كلمة قرآنية (مثال: الرحمة، الحكمة، الصبر، الفرقان)..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20 text-text-primary placeholder:text-text-muted text-sm sm:text-base outline-none transition-all"
                        />
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setSelectedSurahNumber(null);
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 text-xs px-1.5 py-0.5 rounded transition-colors"
                                title="مسح"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setExactMatch(!exactMatch)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                exactMatch
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                    : 'bg-surface-subtle text-text-secondary hover:text-text-primary border-border-default'
                            }`}
                            title="المطابقة التامة للكلمة كلفظ مستقل"
                        >
                            <span>مطابقة تامة</span>
                            {exactMatch && <span>✓</span>}
                        </button>

                        {onSearch && query && (
                            <button
                                type="button"
                                onClick={() => onSearch(query, 'quran-simple-clean')}
                                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                                title="فتح الكلمة في محرك البحث الشامل"
                            >
                                <span>بحث بالآيات</span>
                                <SparklesIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <span className="text-text-muted shrink-0 text-[11px] font-bold ml-1">كلمات مقترحة:</span>
                    {SUGGESTED_KEYWORDS.map((kw, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setQuery(kw);
                                setSelectedSurahNumber(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-sans cursor-pointer ${
                                query === kw
                                    ? 'bg-primary/20 text-primary border border-primary/30 font-bold'
                                    : 'bg-surface-subtle hover:bg-surface-subtle/80 text-text-secondary border border-border-subtle'
                            }`}
                        >
                            {kw}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core Metrics Golden Grid */}
            {normalizedQuery && analysis.stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-200">
                    {/* Card 1: Center of Gravity */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
                                <span>مركز الثقل المصحفي</span>
                                <span>⚖️</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text-primary font-mono mt-1">
                                {analysis.centerOfGravity}
                            </div>
                            <div className="text-xs text-text-secondary font-bold mt-1">
                                يقع في: <span className="text-emerald-600 dark:text-emerald-400">{nearestCenterSurah?.name}</span> ({nearestCenterSurah?.number})
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                            المتوسط الوزني لتوزيع الكلمة على ترتيب السور 1–114
                        </div>
                    </div>

                    {/* Card 2: Peak Word Power */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                                <span>ذروة قوة الكلمة (أعلى كثافة)</span>
                                <span>⚡</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text-primary font-mono mt-1">
                                {analysis.peakSurah?.densityPerThousand || 0}
                                <span className="text-xs font-normal text-text-muted mr-1">لكل ألف</span>
                            </div>
                            <div className="text-xs text-text-secondary font-bold mt-1">
                                في: <span className="text-amber-600 dark:text-amber-400">{analysis.peakSurah?.name}</span> ({analysis.peakSurah?.matchesCount} تكرار)
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                            أعلى تركيز نسبي للكلمة مقارنة بحجم السورة
                        </div>
                    </div>

                    {/* Card 3: Dispersion Rate */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
                                <span>معامل الانتشار المصحفي</span>
                                <span>🌐</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text-primary font-mono mt-1">
                                {analysis.dispersionRate}%
                            </div>
                            <div className="text-xs text-text-secondary font-bold mt-1">
                                وردت في <span className="text-blue-600 dark:text-blue-400">{analysis.surahsCount}</span> سورة من أصل 114
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                            {analysis.dispersionRate > 30 ? 'مفردة كونية شاملة الانتشار' : 'مفردة موضوعية مركزة'}
                        </div>
                    </div>

                    {/* Card 4: Numerical Geometry & Intervals */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
                                <span>هندسة أرقام السور</span>
                                <span>📐</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-text-primary font-mono mt-1">
                                Σ {analysis.surahNumbersSum}
                            </div>
                            <div className="text-xs text-text-secondary font-bold mt-1 flex items-center gap-2">
                                <span>{analysis.evenSurahsCount} زوجي</span>
                                <span>•</span>
                                <span>{analysis.oddSurahsCount} فردي</span>
                            </div>
                        </div>
                        <div className="mt-3 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                            {analysis.meccanCount} مكية مقابل {analysis.medinanCount} مدنية
                        </div>
                    </div>
                </div>
            )}

            {/* 114 Surahs Spectrum Strip (Full Quran Visual Radar) */}
            {normalizedQuery && analysis.stats.length > 0 && (
                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                <span>المخطط الطيفي لكامل المصحف (114 سورة)</span>
                            </span>
                            <span className="text-[11px] text-text-muted hidden md:inline">
                                يمثل كل عمود سورة، ويعبر اللون والارتفاع عن قوة الكلمة وكثافتها
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-xs bg-emerald-500"></span>
                                <span>سورة حاضنة</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-xs bg-surface-subtle border border-border-default"></span>
                                <span>لم ترد فيها</span>
                            </span>
                        </div>
                    </div>

                    {/* The 114 Grid Bars */}
                    <div className="grid grid-cols-19 sm:grid-cols-38 md:grid-cols-57 lg:grid-cols-114 gap-0.5 pt-2 pb-1 items-end h-20 bg-surface-subtle/60 p-2 rounded-xl border border-border-subtle overflow-x-auto">
                        {Array.from({ length: 114 }, (_, idx) => idx + 1).map((sNum) => {
                            const stat = analysis.stats.find(s => s.surahNumber === sNum);
                            const isPresent = Boolean(stat);
                            const density = stat?.densityPerThousand || 0;
                            const maxDensity = analysis.peakSurah?.densityPerThousand || 1;
                            const heightPercent = isPresent ? Math.max(25, Math.min(100, Math.round((density / maxDensity) * 100))) : 8;
                            const isSelected = selectedSurahNumber === sNum;
                            const isCenter = nearestCenterSurah?.number === sNum;

                            return (
                                <button
                                    key={sNum}
                                    onClick={() => {
                                        if (isPresent) setSelectedSurahNumber(sNum);
                                    }}
                                    className={`relative group h-full flex flex-col justify-end items-center cursor-pointer transition-transform hover:scale-110 focus:outline-none ${
                                        !isPresent ? 'cursor-default' : ''
                                    }`}
                                    title={`سورة ${QURAN_INDEX[sNum - 1]?.name} (${sNum})\n${
                                        isPresent
                                            ? `✓ وردت الكلمة: ${stat?.matchesCount} مرة (كثافة: ${stat?.densityPerThousand} في الألف)\nانقر لاستعراض الآيات`
                                            : `✗ لم ترد الكلمة في هذه السورة`
                                    }`}
                                >
                                    {isCenter && (
                                        <span className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-ping"></span>
                                    )}
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className={`w-full rounded-xs transition-all ${
                                            isSelected
                                                ? 'bg-amber-500 ring-2 ring-amber-400 z-10'
                                                : isPresent
                                                ? 'bg-emerald-500 hover:bg-emerald-400'
                                                : 'bg-border-default/40 group-hover:bg-border-default'
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-text-muted px-1 font-mono">
                        <span>1: الفاتحة</span>
                        <span>57: الحديد (النصف)</span>
                        <span>114: الناس</span>
                    </div>
                </div>
            )}

            {/* In-depth Ayah Viewer (When a Surah is clicked) */}
            {selectedSurahData && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-surface to-surface border-2 border-amber-500/40 shadow-md space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border-default">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center font-mono text-sm border border-amber-500/30">
                                {selectedSurahData.surahNumber}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">
                                    سورة {selectedSurahData.name} ({selectedSurahData.englishName})
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                                    <span>{selectedSurahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                    <span>•</span>
                                    <span>ترتيب النزول: {selectedSurahData.revelationOrder}</span>
                                    <span>•</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                        وردت الكلمة {selectedSurahData.matchesCount} مرة
                                    </span>
                                    <span>•</span>
                                    <span>كثافة: {selectedSurahData.densityPerThousand} في الألف</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={`#/surah/${selectedSurahData.surahNumber}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                                فتح كامل السورة بالمصحف
                            </a>
                            <button
                                onClick={() => setSelectedSurahNumber(null)}
                                className="text-text-muted hover:text-red-500 p-1 rounded-lg text-sm"
                                title="إغلاق"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Ayahs List */}
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {selectedSurahData.ayahs.map((ayah, i) => (
                            <div
                                key={i}
                                className="p-3 rounded-xl bg-surface-subtle border border-border-subtle hover:border-amber-400/40 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-base sm:text-lg font-quran leading-loose text-text-primary flex-1 text-right">
                                        {highlightWord(ayah.text, query)}
                                    </p>
                                    <span className="px-2 py-0.5 rounded bg-surface text-xs font-mono font-bold text-amber-600 dark:text-amber-400 border border-border-default shrink-0">
                                        آية {ayah.numberInSurah}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Tabs */}
            {normalizedQuery && analysis.stats.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-default overflow-x-auto pb-1 text-xs sm:text-sm font-bold">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                                    : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <span>📊 الرؤية الهندسية الشاملة</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('table')}
                            className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                                activeTab === 'table'
                                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                                    : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <span>📑 جدول السور الحاضنة ({analysis.stats.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('intervals')}
                            className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                                activeTab === 'intervals'
                                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                                    : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <span>📐 خريطة المسافات البينية (Δ)</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('chronology')}
                            className={`px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
                                activeTab === 'chronology'
                                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                                    : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <span>⏳ التنزيل ⟷ التوقيف</span>
                        </button>
                    </div>

                    {/* TAB 1: OVERVIEW & EDUCATIONAL INSIGHT */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            {/* The 3 Core Theoretical Answers User Asked About */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">1</span>
                                        <span>لماذا اختيرت هذه السور تحديداً؟</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        ورود كلمة "{query}" في {analysis.surahsCount} سورة دون الـ {114 - analysis.surahsCount} الباقية ليس صدفة، بل يشير إلى **حزام موضوعي موحد**. السور الحاضنة تشترك في المعالجة التشريعية أو العقدية التي تمثل الكلمة مفتاحها المحوري.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-2">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">2</span>
                                        <span>ما علاقة أرقام السور بالكلمة؟</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        مركز الثقل المصحفي للكلمة يقع عند النقطة <strong className="font-mono text-text-primary">{analysis.centerOfGravity}</strong> (سورة {nearestCenterSurah?.name}). هذا الرقم يحدد ما إذا كانت الكلمة **تأسيسية** (أوائل المصحف) أم **توجيهية** (أواسطه) أم **خاتمة تذكيرية** (قصار السور).
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-2">
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                                        <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">3</span>
                                        <span>ما هي "قوة الكلمة" المستفادة؟</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        قوة الكلمة تقاس بالكثافة النوعية بالنسبة لحجم السورة. أعلى توهج للكلمة ظهر في سورة <strong className="text-text-primary">{analysis.peakSurah?.name}</strong> بمعدل <strong className="font-mono text-text-primary">{analysis.peakSurah?.densityPerThousand}</strong> كلمة لكل ألف، مما يجعلها البيئة البيانية المثالية لتدبر هذا المفهوم.
                                    </p>
                                </div>
                            </div>

                            {/* Center of Gravity Position Visual Bar */}
                            <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-text-primary">مسار مركز الثقل عبر أثلاث المصحف الثلاثة:</span>
                                    <span className="text-primary font-mono">{analysis.centerOfGravity} / 114</span>
                                </div>

                                <div className="relative w-full h-4 bg-surface-subtle rounded-full overflow-hidden border border-border-subtle flex">
                                    <div className="w-1/3 h-full border-r border-border-default/60 flex items-center justify-center text-[9px] text-text-muted font-bold">
                                        الثلث الأول (1-38)
                                    </div>
                                    <div className="w-1/3 h-full border-r border-border-default/60 flex items-center justify-center text-[9px] text-text-muted font-bold">
                                        الثلث الثاني (39-76)
                                    </div>
                                    <div className="w-1/3 h-full flex items-center justify-center text-[9px] text-text-muted font-bold">
                                        الثلث الثالث (77-114)
                                    </div>
                                </div>

                                <div className="relative w-full h-2">
                                    <div
                                        style={{ left: `${(analysis.centerOfGravity / 114) * 100}%` }}
                                        className="absolute -top-2 transform -translate-x-1/2 flex flex-col items-center"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-surface shadow-md"></div>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                                            {nearestCenterSurah?.name} ({analysis.centerOfGravity})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DETAILED TABLE */}
                    {activeTab === 'table' && (
                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-3 overflow-hidden">
                            {/* Sort Controls */}
                            <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-muted">ترتيب السور حسب:</span>
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'density') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('density'); setSortDirection('desc'); }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                            sortBy === 'density'
                                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                                : 'bg-surface-subtle text-text-secondary border-border-subtle'
                                        }`}
                                    >
                                        قوة الكلمة (الكثافة) {sortBy === 'density' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'count') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('count'); setSortDirection('desc'); }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                            sortBy === 'count'
                                                ? 'bg-primary/20 text-primary border-primary/30'
                                                : 'bg-surface-subtle text-text-secondary border-border-subtle'
                                        }`}
                                    >
                                        عدد التكرار {sortBy === 'count' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'surah') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('surah'); setSortDirection('asc'); }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                            sortBy === 'surah'
                                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                                                : 'bg-surface-subtle text-text-secondary border-border-subtle'
                                        }`}
                                    >
                                        رقم السورة بالمصحف {sortBy === 'surah' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'revelation') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('revelation'); setSortDirection('asc'); }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                            sortBy === 'revelation'
                                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                                : 'bg-surface-subtle text-text-secondary border-border-subtle'
                                        }`}
                                    >
                                        ترتيب النزول {sortBy === 'revelation' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-surface-subtle text-text-muted border-b border-border-default font-bold">
                                        <tr>
                                            <th className="py-2.5 px-3">رقم السورة</th>
                                            <th className="py-2.5 px-3">اسم السورة</th>
                                            <th className="py-2.5 px-3">النزول</th>
                                            <th className="py-2.5 px-3">الفاتحة النورانية</th>
                                            <th className="py-2.5 px-3">تكرار الكلمة</th>
                                            <th className="py-2.5 px-3">إجمالي كلمات السورة</th>
                                            <th className="py-2.5 px-3">قوة الكلمة (لكل ألف)</th>
                                            <th className="py-2.5 px-3 text-center">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-subtle">
                                        {sortedStats.map((item) => {
                                            const isSelected = selectedSurahNumber === item.surahNumber;
                                            return (
                                                <tr
                                                    key={item.surahNumber}
                                                    onClick={() => setSelectedSurahNumber(item.surahNumber)}
                                                    className={`hover:bg-surface-subtle/80 cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-amber-500/10 font-bold' : ''
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 font-mono font-bold text-text-secondary">
                                                        {item.surahNumber}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold text-text-primary text-sm">
                                                        {item.name}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-text-muted">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span>{item.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                                            <span className="text-[10px] font-mono opacity-70">({item.revelationOrder})</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {item.muqattaat ? (
                                                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-amiri font-bold border border-amber-500/20">
                                                                {item.muqattaat}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-muted opacity-40">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                        {item.matchesCount}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono text-text-muted">
                                                        {item.totalWords.toLocaleString()}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 min-w-[36px]">
                                                                {item.densityPerThousand}
                                                            </span>
                                                            <div className="w-16 h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-border-subtle">
                                                                <div
                                                                    style={{
                                                                        width: `${Math.min(100, (item.densityPerThousand / (analysis.peakSurah?.densityPerThousand || 1)) * 100)}%`
                                                                    }}
                                                                    className="h-full bg-amber-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedSurahNumber(item.surahNumber);
                                                            }}
                                                            className="text-primary hover:underline font-bold text-xs"
                                                        >
                                                            عرض الآيات ({item.ayahs.length})
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

                    {/* TAB 3: INTERVALS & DELTA GEOMETRY */}
                    {activeTab === 'intervals' && (
                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-text-primary">
                                    المسافات والفواصل الرقمية (Δ) بين السور الحاضنة المتتالية:
                                </span>
                                <span className="text-text-muted">
                                    متوسط القفزة بين السور: {analysis.intervals.length > 0 ? (analysis.intervals.reduce((a, b) => a + b.delta, 0) / analysis.intervals.length).toFixed(1) : 0} سورة
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {analysis.intervals.map((step, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-center flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                                            <span>سورة {step.from}</span>
                                            <span>⟶</span>
                                            <span>سورة {step.to}</span>
                                        </div>
                                        <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 my-1">
                                            +{step.delta}
                                        </div>
                                        <div className="text-[10px] text-text-muted truncate">
                                            {QURAN_INDEX[step.from - 1]?.name} إلى {QURAN_INDEX[step.to - 1]?.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: CHRONOLOGY VS MUSHAF */}
                    {activeTab === 'chronology' && (
                        <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs space-y-4">
                            <div className="text-xs text-text-secondary leading-relaxed">
                                مقارنة بين <strong>الترتيب التوقيفي للمصحف</strong> (مكان استقرار السورة) و<strong>ترتيب النزول الزمني</strong> (تاريخ نزول السورة أثناء البعثة النبوية):
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        مركز الثقل المكاني (في المصحف التوقيفي):
                                    </div>
                                    <div className="text-2xl font-black font-mono text-text-primary">
                                        {analysis.centerOfGravity}
                                    </div>
                                    <div className="text-xs text-text-muted">
                                        السورة المقابلة: {nearestCenterSurah?.name}
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        مركز الثقل الزمني (في ترتيب النزول):
                                    </div>
                                    <div className="text-2xl font-black font-mono text-text-primary">
                                        {analysis.chronologicalCenterOfGravity}
                                    </div>
                                    <div className="text-xs text-text-muted">
                                        المتوسط الزمني لمرحلة نزول آيات هذه الكلمة
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State / Not Found */}
            {normalizedQuery && analysis.stats.length === 0 && (
                <div className="p-8 text-center bg-surface rounded-2xl border border-border-default space-y-2">
                    <p className="text-text-secondary">
                        لم نعثر على نتائج لكلمة "{query}" بالمطابقة المحددة.
                    </p>
                    <p className="text-xs text-text-muted">
                        جرّب إلغاء "المطابقة التامة" أو كتابة أصل الكلمة بدون زيادات، أو اختر من الكلمات المقترحة أعلاه.
                    </p>
                </div>
            )}
        </div>
    );
};

export default React.memo(WordSurahGeometryView);
