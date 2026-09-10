import React, { useState, useMemo } from 'react';
import type { SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from '../utils/text';
import { calculateSurahPairings, SurahPairScore, AyahMatch } from '../utils/surahPairing';
import { SearchIcon, BookOpenIcon, SparklesIcon, ClearIcon, ArrowLeftIcon } from './icons';

interface SurahPairingViewProps {
    simpleCleanData: SurahData[];
    initialSurahNumber?: number;
    onWordClick?: (word: string, isRoot?: boolean) => void;
    navigateToAyah?: (surahNum: number, ayahNum: number) => void;
    onClose?: () => void;
}

export const SurahPairingView: React.FC<SurahPairingViewProps> = ({
    simpleCleanData,
    initialSurahNumber = 19, // Default to Maryam
    onWordClick,
    navigateToAyah,
    onClose
}) => {
    const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
    const [mode, setMode] = useState<'root' | 'word'>('root');
    const [surahSearchQuery, setSurahSearchQuery] = useState('');
    const [surahCategory, setSurahCategory] = useState<'all' | 'mufassal' | 'tiwal'>('all');
    const [rankedPairsSearch, setRankedPairsSearch] = useState('');
    const [showAllRanked, setShowAllRanked] = useState(false);
    const [activeTab, setActiveTab] = useState<'pairs' | 'matches'>('pairs');
    const [inspectedPairSurah, setInspectedPairSurah] = useState<SurahPairScore | null>(null);

    // Calculate pairings
    const analysis = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return null;
        return calculateSurahPairings(selectedSurahNumber, simpleCleanData, mode);
    }, [selectedSurahNumber, simpleCleanData, mode]);

    // Update inspected pair if current one is reset or not in list
    const currentInspectedPair = useMemo(() => {
        if (!analysis || analysis.rankedPairs.length === 0) return null;
        if (inspectedPairSurah) {
            const found = analysis.rankedPairs.find(p => p.surahNumber === inspectedPairSurah.surahNumber);
            if (found) return found;
        }
        return analysis.rankedPairs[0]; // Top 1 pair
    }, [analysis, inspectedPairSurah]);

    // Filter surahs for selection across all 114 surahs
    const filteredSurahs = useMemo(() => {
        let list = QURAN_INDEX;
        if (surahCategory === 'mufassal') {
            list = list.filter(s => s.number >= 50); // قصار السور والمفصل
        } else if (surahCategory === 'tiwal') {
            list = list.filter(s => s.number < 50); // الطوال والمئين
        }
        if (!surahSearchQuery.trim()) return list;
        const q = surahSearchQuery.trim();
        return list.filter(s => 
            s.name.includes(q) || 
            s.number.toString() === q || 
            s.englishName.toLowerCase().includes(q.toLowerCase())
        );
    }, [surahCategory, surahSearchQuery]);

    // Filtered ranked pairs for the active surah
    const filteredRankedPairs = useMemo(() => {
        if (!analysis) return [];
        if (!rankedPairsSearch.trim()) return analysis.rankedPairs;
        const q = rankedPairsSearch.trim();
        return analysis.rankedPairs.filter(p => 
            p.surahName.includes(q) || 
            p.surahNumber.toString() === q
        );
    }, [analysis, rankedPairsSearch]);

    const sourceSurahMeta = useMemo(() => {
        return QURAN_INDEX.find(s => s.number === selectedSurahNumber) || QURAN_INDEX[0];
    }, [selectedSurahNumber]);

    // Helper to highlight matching terms in text
    const renderHighlightedText = (text: string, matchedTerms: string[]) => {
        if (!matchedTerms || matchedTerms.length === 0) return <span>{text}</span>;
        const termsSet = new Set(matchedTerms);
        const words = text.split(/\s+/);

        return (
            <span>
                {words.map((w, idx) => {
                    // Check if word contains any matched term
                    const isMatched = matchedTerms.some(term => w.includes(term));
                    return (
                        <span
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onWordClick) {
                                    onWordClick(w, mode === 'root');
                                }
                            }}
                            className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-colors cursor-pointer ${
                                isMatched
                                    ? 'bg-amber-400/25 text-amber-900 dark:text-amber-200 font-bold border-b-2 border-amber-500'
                                    : 'hover:bg-primary/10'
                            }`}
                            title={isMatched ? `كلمة/جذر متطابق: ${matchedTerms.join('، ')} (اضغط للبحث)` : 'اضغط للبحث'}
                        >
                            {w}
                        </span>
                    );
                })}
            </span>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-5 animate-fade-in" dir="rtl">
            {/* Top Header Card */}
            <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                                    مستكشف التوأمة وأزواج السور
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                                    المتشابهات وتناسب السور
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
                                اكتشف السورة الزوج والأكثر تطابقاً مع سورتك المختارة، واستخرج أزواج الآيات الأكثر تشابهاً وتداخلاً لفظياً وموضوعياً في القرآن الكريم.
                            </p>
                        </div>
                    </div>

                    {/* Mode selector (Roots vs Words) */}
                    <div className="flex items-center gap-2 bg-surface-subtle border border-border-default p-1 rounded-xl self-start md:self-auto">
                        <button
                            type="button"
                            onClick={() => setMode('root')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mode === 'root'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                            title="المقارنة بناءً على جذور الكلمات واشتراك المعاني والموضوعات"
                        >
                            تطابق الجذور (موضوعي)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('word')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mode === 'word'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                            title="المقارنة بناءً على الألفاظ المباشرة والمتشابهات اللفظية"
                        >
                            تطابق الألفاظ (لفظي)
                        </button>
                    </div>
                </div>

                {/* Surah Selector Carousel / Grid */}
                <div className="mt-4 pt-4 border-t border-border-default space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <BookOpenIcon className="w-4 h-4 text-primary" />
                            <span className="text-xs sm:text-sm font-bold text-text-primary">
                                اختر من سور القرآن الكريم (114 سورة):
                            </span>
                        </div>

                        {/* Quick Jump Dropdown */}
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedSurahNumber}
                                onChange={(e) => {
                                    setSelectedSurahNumber(Number(e.target.value));
                                    setInspectedPairSurah(null);
                                }}
                                aria-label="اختر سورة مباشرة من القائمة"
                                className="text-xs px-2.5 py-1.5 bg-surface-subtle border border-border-default rounded-lg text-text-primary focus:outline-hidden focus:border-primary font-medium"
                            >
                                {QURAN_INDEX.map(s => (
                                    <option key={s.number} value={s.number}>
                                        {s.number}. سورة {formatSurahNameForDisplay(s.name)} ({s.numberOfAyahs} آية)
                                    </option>
                                ))}
                            </select>

                            {/* Search Filter */}
                            <div className="relative w-36 sm:w-48">
                                <input
                                    type="text"
                                    placeholder="بحث باسم أو رقم السورة..."
                                    value={surahSearchQuery}
                                    onChange={(e) => setSurahSearchQuery(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 pr-7 bg-surface-subtle border border-border-default rounded-lg focus:outline-hidden focus:border-primary text-text-primary"
                                />
                                <SearchIcon className="w-3.5 h-3.5 absolute right-2 top-2.5 text-text-muted" />
                                {surahSearchQuery && (
                                    <button
                                        onClick={() => setSurahSearchQuery('')}
                                        className="absolute left-2 top-2 text-text-muted hover:text-text-primary"
                                    >
                                        <ClearIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Surah Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setSurahCategory('all')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                surahCategory === 'all'
                                    ? 'bg-primary/15 text-primary border border-primary/30 font-bold'
                                    : 'text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            كل السور (114)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSurahCategory('mufassal')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                surahCategory === 'mufassal'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold'
                                    : 'text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            <span>قصار السور والمفصل (50 - 114)</span>
                            <span className="text-[10px] bg-amber-500/20 px-1.5 rounded-full">مثل الكوثر والماعون</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSurahCategory('tiwal')}
                            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                surahCategory === 'tiwal'
                                    ? 'bg-primary/15 text-primary border border-primary/30 font-bold'
                                    : 'text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            الطوال والمئين (1 - 49)
                        </button>
                    </div>

                    {/* Surah chips list (All matching surahs, without truncation) */}
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin max-h-28 flex-wrap">
                        {filteredSurahs.map((s) => {
                            const isSelected = s.number === selectedSurahNumber;
                            return (
                                <button
                                    key={s.number}
                                    type="button"
                                    onClick={() => {
                                        setSelectedSurahNumber(s.number);
                                        setInspectedPairSurah(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary text-white border-primary shadow-xs'
                                            : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border-border-default'
                                    }`}
                                >
                                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                        {s.number}
                                    </span>
                                    <span>{formatSurahNameForDisplay(s.name)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Classical / Thematic Relationship Card */}
            {analysis?.classicalPair && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xs relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1">
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    <span>الزوج في علم تناسب السور والتفسير الموضوعي</span>
                                </span>
                                <span className="text-xs text-text-muted">نظم الدرر وعلم التناسب</span>
                            </div>
                            <div className="text-base sm:text-lg font-bold text-text-primary flex items-center flex-wrap gap-2 pt-1">
                                <span>قرينة سورة</span>
                                <span className="text-primary">{formatSurahNameForDisplay(sourceSurahMeta.name)}</span>
                                <span>هي سورة</span>
                                <span className="text-amber-700 dark:text-amber-300 font-extrabold bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                                    {formatSurahNameForDisplay(analysis.classicalPair.pairSurahName)} (رقم {analysis.classicalPair.pairSurahNumber})
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-1">
                                {analysis.classicalPair.relationshipDescription}
                            </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-start md:self-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    const targetPair = analysis.rankedPairs.find(p => p.surahNumber === analysis.classicalPair?.pairSurahNumber);
                                    if (targetPair) {
                                        setInspectedPairSurah(targetPair);
                                    }
                                }}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span>فحص تطابق الآيات معها</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedSurahNumber(analysis.classicalPair!.pairSurahNumber);
                                    setInspectedPairSurah(null);
                                }}
                                className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border-default text-xs font-bold text-text-primary transition-all cursor-pointer"
                                title={`الانتقال لدراسة سورة ${analysis.classicalPair.pairSurahName}`}
                            >
                                <span>الانتقال إليها</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Insights Box: The Soulmate / Pair Surah */}
            {currentInspectedPair && (
                <div className="bg-gradient-to-br from-amber-500/10 via-surface to-primary/5 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-md relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <SparklesIcon className="w-4 h-4" />
                                <span>النتيجة الرياضية والبيانية:</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center flex-wrap gap-2">
                                <span>سورة</span>
                                <span className="text-primary underline decoration-primary/40 underline-offset-4">
                                    {formatSurahNameForDisplay(sourceSurahMeta.name)}
                                </span>
                                <span className="text-text-muted font-normal">زوجها الأقرب هو</span>
                                <span className="text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-500/30">
                                    {formatSurahNameForDisplay(currentInspectedPair.surahName)}
                                </span>
                            </h2>
                            <p className="text-xs sm:text-sm text-text-secondary mt-2">
                                بناءً على تحليل {mode === 'root' ? 'الجذور اللغوية والموضوعات المشتركة' : 'الألفاظ المباشرة والمتشابهات اللفظية'}، تشترك السورتان في كثافة عالية من المفردات ومطابقة الآيات.
                            </p>
                        </div>

                        {/* Affinity Gauge */}
                        <div className="bg-surface border border-border-default rounded-xl p-3 sm:p-4 text-center shrink-0 min-w-[170px] shadow-2xs">
                            <div className="text-[11px] font-semibold text-text-secondary">نسبة التطابق والتناسب</div>
                            <div className="text-2.5xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono my-0.5">
                                {currentInspectedPair.pairingScore}%
                            </div>
                            <div className="text-[10px] text-text-muted">
                                {currentInspectedPair.rawAyahMatchesCount} آية متناسبة
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-border-default/60 text-center">
                        <div className="p-2.5 rounded-xl bg-surface/70 border border-border-default">
                            <div className="text-[11px] text-text-secondary font-medium">عدد آيات {formatSurahNameForDisplay(sourceSurahMeta.name)}</div>
                            <div className="text-base font-bold text-primary font-mono mt-0.5">{sourceSurahMeta.numberOfAyahs}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface/70 border border-border-default">
                            <div className="text-[11px] text-text-secondary font-medium">عدد آيات {formatSurahNameForDisplay(currentInspectedPair.surahName)}</div>
                            <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{currentInspectedPair.numberOfAyahs}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface/70 border border-border-default">
                            <div className="text-[11px] text-text-secondary font-medium">الكلمات المشتركة</div>
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{currentInspectedPair.sharedSignificantWords}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface/70 border border-border-default">
                            <div className="text-[11px] text-text-secondary font-medium">الجذور المشتركة</div>
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">{currentInspectedPair.sharedSignificantRoots}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs between: Top Pairs Ranking vs Top Ayah Matches */}
            <div className="flex border-b border-border-default gap-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('pairs')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'pairs'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    ترتيب أقرب السور لـ {formatSurahNameForDisplay(sourceSurahMeta.name)} ({analysis?.rankedPairs.length || 0})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('matches')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'matches'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    أكثر الآيات تطابقاً في عموم المصحف ({analysis?.allQuranTopAyahMatches.length || 0})
                </button>
            </div>

            {/* Tab 1: Ranked Pairs List */}
            {activeTab === 'pairs' && analysis && (
                <div className="space-y-4">
                    {/* Ranked pairs control bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle p-3 rounded-xl border border-border-default">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary">
                                ترتيب جميع السور الـ ({analysis.rankedPairs.length}) حسب الأقرب:
                            </span>
                            <span className="text-xs text-text-muted">
                                {showAllRanked ? `(يُعرض كل ${filteredRankedPairs.length} سورة)` : `(يُعرض أول ${Math.min(18, filteredRankedPairs.length)} سورة)`}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-40 sm:w-52">
                                <input
                                    type="text"
                                    placeholder="ابحث في السور المرتبة..."
                                    value={rankedPairsSearch}
                                    onChange={(e) => setRankedPairsSearch(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 pr-7 bg-surface border border-border-default rounded-lg focus:outline-hidden focus:border-primary text-text-primary"
                                />
                                <SearchIcon className="w-3.5 h-3.5 absolute right-2 top-2.5 text-text-muted" />
                                {rankedPairsSearch && (
                                    <button
                                        onClick={() => setRankedPairsSearch('')}
                                        className="absolute left-2 top-2 text-text-muted hover:text-text-primary"
                                    >
                                        <ClearIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAllRanked(!showAllRanked)}
                                className="px-3 py-1.5 rounded-lg bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold text-primary transition-colors cursor-pointer shrink-0"
                            >
                                {showAllRanked ? 'عرض أهم 18 سورة' : 'عرض جميع السور (113 كاملة)'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(showAllRanked ? filteredRankedPairs : filteredRankedPairs.slice(0, 18)).map((pair, idx) => {
                            const isCurrentInspected = currentInspectedPair?.surahNumber === pair.surahNumber;
                            const originalRank = analysis.rankedPairs.findIndex(p => p.surahNumber === pair.surahNumber) + 1;
                            return (
                                <div
                                    key={pair.surahNumber}
                                    onClick={() => setInspectedPairSurah(pair)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                        isCurrentInspected
                                            ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-2 ring-amber-500/30'
                                            : 'bg-surface border-border-default hover:border-primary/50 hover:bg-surface-hover'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                                                    originalRank === 1 ? 'bg-amber-500 text-white' : originalRank === 2 ? 'bg-zinc-400 text-white' : originalRank === 3 ? 'bg-amber-700 text-white' : 'bg-surface-subtle text-text-secondary'
                                                }`}>
                                                    {originalRank}
                                                </span>
                                                <span className="font-bold text-text-primary text-base">
                                                    {formatSurahNameForDisplay(pair.surahName)}
                                                </span>
                                                <span className="text-[11px] text-text-muted font-mono">
                                                    ({pair.surahNumber})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {pair.isClassicalPair && (
                                                    <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                                                        الزوج التراثي
                                                    </span>
                                                )}
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                    {pair.pairingScore}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-text-secondary mt-3 pt-2 border-t border-border-default/60">
                                        <span>{pair.numberOfAyahs} آية</span>
                                        <span>{pair.sharedSignificantWords} كلمة مشتركة</span>
                                        <span className="text-primary font-medium">
                                            {pair.rawAyahMatchesCount} تطابق آيات
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!showAllRanked && filteredRankedPairs.length > 18 && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAllRanked(true)}
                                className="px-5 py-2 rounded-xl bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary transition-all shadow-2xs"
                            >
                                عرض بقية السور ({filteredRankedPairs.length - 18} سورة إضافية)
                            </button>
                        </div>
                    )}

                    {/* Detailed Ayah Matches for Inspected Pair */}
                    {currentInspectedPair && (
                        <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 mt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                                    <span>الآيات المتطابقة بين {formatSurahNameForDisplay(sourceSurahMeta.name)} و {formatSurahNameForDisplay(currentInspectedPair.surahName)}</span>
                                </h3>
                                <span className="text-xs text-text-secondary">
                                    {currentInspectedPair.topAyahMatches.length} زوج آيات متطابق
                                </span>
                            </div>

                            {currentInspectedPair.topAyahMatches.length === 0 ? (
                                <div className="text-center py-8 text-text-muted text-sm">
                                    لا توجد أزواج آيات مباشرة ذات تطابق عالٍ، الارتباط ناتج عن تشارك عام في المفردات والجذور.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentInspectedPair.topAyahMatches.map((match, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 sm:p-4 rounded-xl border border-border-default bg-surface-subtle/50 space-y-2.5"
                                        >
                                            {/* Source Ayah */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                            {formatSurahNameForDisplay(sourceSurahMeta.name)} : آية {match.sourceAyah.ayahNumber}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (navigateToAyah) {
                                                                    navigateToAyah(match.sourceAyah.surahNumber, match.sourceAyah.ayahNumber);
                                                                } else {
                                                                    window.location.hash = `#/surah/${match.sourceAyah.surahNumber}?ayah=${match.sourceAyah.ayahNumber}`;
                                                                }
                                                            }}
                                                            className="text-[11px] text-text-secondary hover:text-primary underline cursor-pointer"
                                                        >
                                                            عرض في المصحف
                                                        </button>
                                                    </div>
                                                    <p className="font-quran text-base sm:text-lg text-text-primary leading-loose">
                                                        {renderHighlightedText(match.sourceAyah.text, match.matchedTerms)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="flex items-center gap-2 text-text-muted text-xs my-1">
                                                <div className="h-px bg-border-default flex-1" />
                                                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">
                                                    تطابق: {match.matchedTerms.join(' • ')}
                                                </span>
                                                <div className="h-px bg-border-default flex-1" />
                                            </div>

                                            {/* Target Ayah */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            {formatSurahNameForDisplay(currentInspectedPair.surahName)} : آية {match.targetAyah.ayahNumber}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (navigateToAyah) {
                                                                    navigateToAyah(match.targetAyah.surahNumber, match.targetAyah.ayahNumber);
                                                                } else {
                                                                    window.location.hash = `#/surah/${match.targetAyah.surahNumber}?ayah=${match.targetAyah.ayahNumber}`;
                                                                }
                                                            }}
                                                            className="text-[11px] text-text-secondary hover:text-primary underline cursor-pointer"
                                                        >
                                                            عرض في المصحف
                                                        </button>
                                                    </div>
                                                    <p className="font-quran text-base sm:text-lg text-text-primary leading-loose">
                                                        {renderHighlightedText(match.targetAyah.text, match.matchedTerms)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: All Quran Top Ayah Matches for the Selected Surah */}
            {activeTab === 'matches' && analysis && (
                <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-text-primary">
                            أقوى الآيات المتطابقة مع آيات {formatSurahNameForDisplay(sourceSurahMeta.name)} في عموم سور القرآن
                        </h3>
                        <span className="text-xs text-text-secondary">
                            أعلى {analysis.allQuranTopAyahMatches.length} تطابقاً
                        </span>
                    </div>

                    <div className="space-y-3">
                        {analysis.allQuranTopAyahMatches.map((match, idx) => {
                            const targetSurahInfo = QURAN_INDEX.find(s => s.number === match.targetAyah.surahNumber);
                            return (
                                <div
                                    key={idx}
                                    className="p-3.5 sm:p-4 rounded-xl border border-border-default bg-surface-subtle/50 space-y-2.5"
                                >
                                    {/* Source Ayah */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                {formatSurahNameForDisplay(sourceSurahMeta.name)} : {match.sourceAyah.ayahNumber}
                                            </span>
                                        </div>
                                        <p className="font-quran text-base sm:text-lg text-text-primary leading-loose">
                                            {renderHighlightedText(match.sourceAyah.text, match.matchedTerms)}
                                        </p>
                                    </div>

                                    {/* Match Bridge */}
                                    <div className="flex items-center gap-2 text-text-muted text-xs my-1">
                                        <div className="h-px bg-border-default flex-1" />
                                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">
                                            المشترك: {match.matchedTerms.join(' • ')}
                                        </span>
                                        <div className="h-px bg-border-default flex-1" />
                                    </div>

                                    {/* Target Ayah */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                سورة {formatSurahNameForDisplay(targetSurahInfo?.name)} : {match.targetAyah.ayahNumber}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (navigateToAyah) {
                                                        navigateToAyah(match.targetAyah.surahNumber, match.targetAyah.ayahNumber);
                                                    } else {
                                                        window.location.hash = `#/surah/${match.targetAyah.surahNumber}?ayah=${match.targetAyah.ayahNumber}`;
                                                    }
                                                }}
                                                className="text-[11px] text-text-secondary hover:text-primary underline cursor-pointer"
                                            >
                                                عرض في المصحف
                                            </button>
                                        </div>
                                        <p className="font-quran text-base sm:text-lg text-text-primary leading-loose">
                                            {renderHighlightedText(match.targetAyah.text, match.matchedTerms)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
