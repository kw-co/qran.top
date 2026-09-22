import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { 
    analyzeSyllableAttachments, 
    POPULAR_SYLLABLE_PRESETS, 
    AttachmentMode,
    AttachedLetterStats,
    SyllableMatch
} from '../utils/syllableAttachment';
import { 
    SparklesIcon, 
    SearchIcon, 
    ClearIcon, 
    CopyIcon, 
    CheckIcon, 
    BookOpenIcon, 
    ChevronLeftIcon,
    ArrowRightIcon,
    ArrowLeftIcon
} from './icons';

interface SyllableClusterViewProps {
    simpleCleanData: SurahData[];
    onSearch?: (word: string, sourceEdition?: string) => void;
}

export type ViewDisplayOption = 'eight_dual' | 'front_only' | 'back_only' | 'combined_rank';

interface ActiveLetterFilter {
    letter: string;
    position: 'before' | 'after' | 'any';
}

export const SyllableClusterView: React.FC<SyllableClusterViewProps> = ({ 
    simpleCleanData,
    onSearch 
}) => {
    // 1. Search & Filter State
    const [inputSyllable, setInputSyllable] = useState<string>('حم');
    const [appliedSyllable, setAppliedSyllable] = useState<string>('حم');
    const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('all_adjacent');
    const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
    
    // View option: default to eight_dual (8 letters: 4 front + 4 back open always!)
    const [viewOption, setViewOption] = useState<ViewDisplayOption>('eight_dual');

    // Filter by specific letter & position
    const [activeFilter, setActiveFilter] = useState<ActiveLetterFilter | null>(null);

    const [verseSearchQuery, setVerseSearchQuery] = useState<string>('');
    const [visibleVersesCount, setVisibleVersesCount] = useState<number>(30);
    const [copiedAyahId, setCopiedAyahId] = useState<string | null>(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 2. Perform Analysis
    const analysisResult = useMemo(() => {
        return analyzeSyllableAttachments(
            simpleCleanData,
            appliedSyllable,
            attachmentMode,
            selectedSurah
        );
    }, [simpleCleanData, appliedSyllable, attachmentMode, selectedSurah]);

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputSyllable.trim();
        if (trimmed) {
            setAppliedSyllable(trimmed);
            setActiveFilter(null);
            setVisibleVersesCount(30);
        }
    };

    // Quick preset click
    const handleSelectPreset = (presetSyllable: string) => {
        setInputSyllable(presetSyllable);
        setAppliedSyllable(presetSyllable);
        setActiveFilter(null);
        setVisibleVersesCount(30);
    };

    // Filter matches based on selected letter and verse search
    const filteredMatches = useMemo(() => {
        let list = analysisResult.matches;

        if (activeFilter) {
            list = list.filter(m => {
                if (activeFilter.position === 'before') {
                    return m.attachedBefore === activeFilter.letter;
                } else if (activeFilter.position === 'after') {
                    return m.attachedAfter === activeFilter.letter;
                } else {
                    return m.attachedBefore === activeFilter.letter || 
                           m.attachedAfter === activeFilter.letter || 
                           m.normalizedWord.includes(activeFilter.letter);
                }
            });
        }

        if (verseSearchQuery.trim()) {
            const q = verseSearchQuery.trim();
            list = list.filter(m => 
                m.ayahText.includes(q) || 
                m.originalWord.includes(q) || 
                m.surahName.includes(q)
            );
        }

        return list;
    }, [analysisResult.matches, activeFilter, verseSearchQuery]);

    // Handle copy ayah text
    const handleCopy = (ayahText: string, surahName: string, ayahNum: number, id: string) => {
        const textToCopy = `﴿${ayahText}﴾ [${surahName}: ${ayahNum}]`;
        navigator.clipboard.writeText(textToCopy);
        setCopiedAyahId(id);
        setTimeout(() => setCopiedAyahId(null), 2000);
    };

    // Helper to toggle active letter filter
    const handleLetterCardClick = (letter: string, position: 'before' | 'after' | 'any') => {
        if (activeFilter && activeFilter.letter === letter && activeFilter.position === position) {
            setActiveFilter(null);
        } else {
            setActiveFilter({ letter, position });
        }
    };

    // Rank styling config for FRONT (قدام - السوابق)
    const FRONT_RANK_CONFIGS = [
        {
            rankLabel: 'المركز 1 من الأمام 🥇',
            border: 'border-blue-500/50 hover:border-blue-500 dark:border-blue-400/40',
            bg: 'bg-blue-500/10 dark:bg-blue-500/15',
            badgeBg: 'bg-blue-600 text-white font-bold',
            letterColor: 'text-blue-600 dark:text-blue-400',
            glow: 'ring-2 ring-blue-500/50'
        },
        {
            rankLabel: 'المركز 2 من الأمام 🥈',
            border: 'border-cyan-500/50 hover:border-cyan-500 dark:border-cyan-400/40',
            bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
            badgeBg: 'bg-cyan-600 text-white font-bold',
            letterColor: 'text-cyan-600 dark:text-cyan-400',
            glow: 'ring-2 ring-cyan-500/50'
        },
        {
            rankLabel: 'المركز 3 من الأمام 🥉',
            border: 'border-teal-500/50 hover:border-teal-500 dark:border-teal-400/40',
            bg: 'bg-teal-500/10 dark:bg-teal-500/15',
            badgeBg: 'bg-teal-600 text-white font-bold',
            letterColor: 'text-teal-600 dark:text-teal-400',
            glow: 'ring-2 ring-teal-500/50'
        },
        {
            rankLabel: 'المركز 4 من الأمام 🎖️',
            border: 'border-indigo-500/50 hover:border-indigo-500 dark:border-indigo-400/40',
            bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
            badgeBg: 'bg-indigo-600 text-white font-bold',
            letterColor: 'text-indigo-600 dark:text-indigo-400',
            glow: 'ring-2 ring-indigo-500/50'
        }
    ];

    // Rank styling config for BACK (ورى - اللواحق)
    const BACK_RANK_CONFIGS = [
        {
            rankLabel: 'المركز 1 من الخلف 🥇',
            border: 'border-amber-500/50 hover:border-amber-500 dark:border-amber-400/40',
            bg: 'bg-amber-500/10 dark:bg-amber-500/15',
            badgeBg: 'bg-amber-500 text-slate-950 font-bold',
            letterColor: 'text-amber-600 dark:text-amber-400',
            glow: 'ring-2 ring-amber-500/50'
        },
        {
            rankLabel: 'المركز 2 من الخلف 🥈',
            border: 'border-emerald-500/50 hover:border-emerald-500 dark:border-emerald-400/40',
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
            badgeBg: 'bg-emerald-600 text-white font-bold',
            letterColor: 'text-emerald-600 dark:text-emerald-400',
            glow: 'ring-2 ring-emerald-500/50'
        },
        {
            rankLabel: 'المركز 3 من الخلف 🥉',
            border: 'border-rose-500/50 hover:border-rose-500 dark:border-rose-400/40',
            bg: 'bg-rose-500/10 dark:bg-rose-500/15',
            badgeBg: 'bg-rose-600 text-white font-bold',
            letterColor: 'text-rose-600 dark:text-rose-400',
            glow: 'ring-2 ring-rose-500/50'
        },
        {
            rankLabel: 'المركز 4 من الخلف 🎖️',
            border: 'border-purple-500/50 hover:border-purple-500 dark:border-purple-400/40',
            bg: 'bg-purple-500/10 dark:bg-purple-500/15',
            badgeBg: 'bg-purple-600 text-white font-bold',
            letterColor: 'text-purple-600 dark:text-purple-400',
            glow: 'ring-2 ring-purple-500/50'
        }
    ];

    // Card Renderer Component for attached letter
    const renderLetterCard = (
        item: AttachedLetterStats, 
        idx: number, 
        position: 'before' | 'after' | 'both',
        configs: typeof FRONT_RANK_CONFIGS
    ) => {
        const config = configs[idx] || configs[3];
        const isSelected = activeFilter?.letter === item.letter && 
            (position === 'both' ? activeFilter.position === 'any' : activeFilter.position === position);

        const countToShow = position === 'before' 
            ? item.beforeCount 
            : position === 'after' 
                ? item.afterCount 
                : item.totalCount;

        const isBefore = position === 'before';
        const isAfter = position === 'after';

        return (
            <div
                key={`${item.letter}_${position}_${idx}`}
                onClick={() => handleLetterCardClick(item.letter, position === 'both' ? 'any' : position)}
                className={`bg-surface rounded-2xl p-4 md:p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-md ${
                    isSelected 
                        ? `${config.border} ${config.glow} ${config.bg}` 
                        : `border-border-default ${config.border}`
                }`}
            >
                {/* Top Rank Badge */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${config.badgeBg}`}>
                        {config.rankLabel}
                    </span>
                    <span className="text-xs font-bold text-text-muted">
                        {item.percentage}%
                    </span>
                </div>

                {/* Big Letter & Name */}
                <div className="flex items-center justify-between gap-2 my-2 p-3 bg-surface-subtle rounded-xl border border-border-subtle group-hover:scale-102 transition-transform">
                    <div className="flex items-center gap-3">
                        <span className={`font-amiri text-4xl md:text-5xl font-bold leading-none ${config.letterColor}`}>
                            {item.letter}
                        </span>
                        <div>
                            <span className="text-sm font-bold text-text-primary block">
                                حرف {item.letterName}
                            </span>
                            <span className="text-xs text-text-muted block">
                                {countToShow.toLocaleString('ar-SA')} موضعاً
                            </span>
                        </div>
                    </div>

                    {/* Direction Visual Badge */}
                    <div className="flex flex-col items-center justify-center px-2 py-1 bg-surface rounded-lg border border-border-default text-[11px] font-bold">
                        {isBefore && (
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-amiri text-sm" title="الحرف يلتصق من الأمام قبل المقطع">
                                <span>{item.letter}</span>
                                <span className="text-xs text-text-muted">←</span>
                                <span className="text-text-primary font-bold">{appliedSyllable}</span>
                            </span>
                        )}
                        {isAfter && (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-amiri text-sm" title="الحرف يلتصق من الخلف بعد المقطع">
                                <span className="text-text-primary font-bold">{appliedSyllable}</span>
                                <span className="text-xs text-text-muted">←</span>
                                <span>{item.letter}</span>
                            </span>
                        )}
                        {position === 'both' && (
                            <span className="text-text-secondary text-[10px]">
                                مزدوج
                            </span>
                        )}
                    </div>
                </div>

                {/* Breakdown Details */}
                <div className="mt-2 pt-2 border-t border-border-subtle space-y-1 text-xs">
                    {position === 'both' ? (
                        <>
                            <div className="flex items-center justify-between text-text-secondary">
                                <span>من الأمام (سابق):</span>
                                <span className="font-bold text-text-primary">
                                    {item.beforeCount.toLocaleString('ar-SA')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-text-secondary">
                                <span>من الخلف (لاحق):</span>
                                <span className="font-bold text-text-primary">
                                    {item.afterCount.toLocaleString('ar-SA')}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between text-text-secondary">
                            <span>{isBefore ? 'التصاق من الأمام:' : 'التصاق من الخلف:'}</span>
                            <span className="font-bold text-text-primary">
                                {countToShow.toLocaleString('ar-SA')} صلة
                            </span>
                        </div>
                    )}
                </div>

                {/* Examples */}
                {item.exampleWords.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border-subtle">
                        <span className="text-[10px] text-text-muted block mb-1">
                            {isBefore ? 'أمثلة بـ (الحرف + المقطع):' : isAfter ? 'أمثلة بـ (المقطع + الحرف):' : 'أمثلة من التنزيل:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {item.exampleWords.slice(0, 3).map((w, wI) => (
                                <span 
                                    key={wI} 
                                    className="font-amiri text-xs px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-text-primary font-bold"
                                >
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selection hint */}
                <div className="mt-3 pt-2 text-center">
                    <span className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        isSelected ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                    }`}>
                        {isSelected ? '✓ مصفّى في الآيات' : 'اضغط للتصفية وعرض الآيات ←'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl text-text-primary min-h-[80vh] space-y-8" dir="rtl">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                <a
                    href="#/structure"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-subtle"
                >
                    <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    <span>العودة إلى بنية المصحف</span>
                </a>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>محلل اتصالات المقاطع القرآنية</span>
                </div>
            </div>

            {/* Header Section */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex">
                                <SparklesIcon className="w-7 h-7" />
                            </span>
                            <span>مستكشف الحروف الملتصقة بالمقاطع (8 حروف: 4 قدام + 4 ورى)</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl">
                            أداة دقيقة تحسب لك <span className="font-bold text-text-primary">ثمانية حروف تلقائياً: أربعة حروف من الأمام (السوابق) وأربعة حروف من الخلف (اللواحق)</span> الأكثر التصاقاً واقتراناً بأي مقطع أو لفظ قرآني (مثل اقتران «حم» بـ <span className="text-blue-600 dark:text-blue-400 font-bold">اللام والميم</span> من الأمام كـ «الحمد ومحمد»، واقترانه بـ <span className="text-amber-600 dark:text-amber-400 font-bold">الدال واللام</span> من الخلف كـ «الحمد وحمل»).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 bg-surface-subtle p-3 rounded-xl border border-border-subtle text-xs">
                        <span className="text-text-muted font-medium">المقطع النشط:</span>
                        <span className="font-amiri text-xl font-bold text-primary px-2.5 py-0.5 rounded-lg bg-surface border border-border-default shadow-xs">
                            {appliedSyllable}
                        </span>
                        <span className="text-text-muted mr-2">التكرارات:</span>
                        <span className="font-bold text-text-primary">
                            {analysisResult.totalOccurrences.toLocaleString('ar-SA')}
                        </span>
                    </div>
                </div>

                {/* Input & Search Form */}
                <form onSubmit={handleSubmit} className="pt-4 border-t border-border-default">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4 space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary block">
                                أدخل المقطع أو اللفظ القرآني المراد تحليله:
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputSyllable}
                                    onChange={(e) => setInputSyllable(e.target.value)}
                                    placeholder="مثلاً: حم، الم، طه، يس، سبح، علم..."
                                    className="w-full py-2.5 px-4 bg-surface-subtle border border-border-default rounded-xl text-base md:text-lg font-amiri font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                    dir="rtl"
                                />
                                {inputSyllable && (
                                    <button
                                        type="button"
                                        onClick={() => setInputSyllable('')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                    >
                                        <ClearIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Surah Filter */}
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary block">
                                نطاق التحليل في المصحف:
                            </label>
                            <select
                                value={selectedSurah || ''}
                                onChange={(e) => {
                                    setSelectedSurah(e.target.value ? Number(e.target.value) : undefined);
                                    setActiveFilter(null);
                                }}
                                className="w-full py-2.5 px-3 bg-surface-subtle border border-border-default rounded-xl text-xs md:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">كامل القرآن الكريم (114 سورة)</option>
                                {QURAN_INDEX.map((s) => (
                                    <option key={s.number} value={s.number}>
                                        سورة {s.name} ({s.number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Attachment Mode */}
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary block">
                                نوع الاحتساب الإحصائي:
                            </label>
                            <select
                                value={attachmentMode}
                                onChange={(e) => {
                                    setAttachmentMode(e.target.value as AttachmentMode);
                                    setActiveFilter(null);
                                }}
                                className="w-full py-2.5 px-3 bg-surface-subtle border border-border-default rounded-xl text-xs md:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all_adjacent">كل الحروف الملتصقة (سوابق ولواحق مباشرة)</option>
                                <option value="before_only">الحروف السابقة فقط (قبل المقطع مباشرة - قدام)</option>
                                <option value="after_only">الحروف اللاحقة فقط (بعد المقطع مباشرة - ورى)</option>
                                <option value="all_in_word">جميع حروف الكلمة المصاحبة للمقطع</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                            >
                                <SearchIcon className="w-4 h-4" />
                                <span>تحليل المقطع</span>
                            </button>
                        </div>
                    </div>

                    {/* Presets Chips */}
                    <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center gap-2">
                        <span className="text-xs text-text-muted font-bold ml-1">مقاطع مقترحة للتجربة:</span>
                        {POPULAR_SYLLABLE_PRESETS.map(p => (
                            <button
                                key={p.syllable}
                                type="button"
                                onClick={() => handleSelectPreset(p.syllable)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    appliedSyllable === p.syllable
                                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400 font-extrabold shadow-xs'
                                        : 'bg-surface-subtle hover:bg-surface text-text-secondary border-border-default hover:border-text-muted'
                                }`}
                                title={p.description}
                            >
                                {p.title}
                            </button>
                        ))}
                    </div>
                </form>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">مرات ورود المقطع</span>
                    <span className="text-xl md:text-2xl font-bold text-text-primary">
                        {analysisResult.totalOccurrences.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">في الكلمات القرآنية</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">الكلمات المطابقة</span>
                    <span className="text-xl md:text-2xl font-bold text-primary">
                        {analysisResult.totalMatchingWords.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">مفردة قرآنية متميزة</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-blue-500">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">روابط الأمام (السوابق - قدام)</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analysisResult.totalBeforeCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">صلة سابقة قبل المقطع</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-amber-500">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">روابط الخلف (اللواحق - ورى)</span>
                    <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {analysisResult.totalAfterCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">صلة لاحقة بعد المقطع</span>
                </div>
            </div>

            {/* VIEW OPTIONS SWITCHER / TOGGLE TABS */}
            <div className="bg-surface rounded-2xl border border-border-default p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    <span className="text-xs text-text-muted font-bold ml-2">طريقة العرض:</span>
                    
                    <button
                        type="button"
                        onClick={() => setViewOption('eight_dual')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            viewOption === 'eight_dual'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>🌟</span>
                        <span>عرض الـ 8 حروف (4 قدام + 4 ورى) [مفتوح دائماً]</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewOption('front_only')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            viewOption === 'front_only'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                        <span>من الأمام فقط (السوابق - 4 حروف قدام)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewOption('back_only')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            viewOption === 'back_only'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 rotate-180" />
                        <span>من الخلف فقط (اللواحق - 4 حروف ورى)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewOption('combined_rank')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            viewOption === 'combined_rank'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>الترتيب المجمّع لكافة الحروف</span>
                    </button>
                </div>

                {activeFilter && (
                    <button
                        type="button"
                        onClick={() => setActiveFilter(null)}
                        className="px-3 py-1.5 text-xs font-bold bg-surface border border-primary/30 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs mr-auto md:mr-0"
                    >
                        <ClearIcon className="w-3.5 h-3.5" />
                        <span>
                            إلغاء تصفية حرف ({activeFilter.letter}) {activeFilter.position === 'before' ? 'من الأمام' : activeFilter.position === 'after' ? 'من الخلف' : ''}
                        </span>
                    </button>
                )}
            </div>

            {/* MAIN RESULTS DISPLAY: 8 LETTERS / FRONT / BACK */}
            {viewOption === 'eight_dual' && (
                <div className="space-y-6">
                    {/* Visual Explanation Banner */}
                    <div className="bg-gradient-to-r from-blue-500/10 via-surface to-amber-500/10 rounded-2xl border border-border-default p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/15 text-primary">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-primary">
                                    لوحة الثمانية حروف الأكثر التصاقاً بالمقطع «{appliedSyllable}» عبر المصحف كاملاً
                                </h3>
                                <p className="text-xs text-text-secondary">
                                    أربعة حروف من الأمام (قبل المقطع مباشرة) + أربعة حروف من الخلف (بعد المقطع مباشرة).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold">
                                <span>[ الحرف ] ← [{appliedSyllable}]</span>
                                <span>قدام</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
                                <span>[{appliedSyllable}] ← [ الحرف ]</span>
                                <span>ورى</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* SECTION 1: FRONT (4 حروف من الأمام - السوابق) */}
                        <div className="bg-surface rounded-2xl border-2 border-blue-500/30 p-5 md:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                                        <ArrowRightIcon className="w-5 h-5 rotate-180" />
                                    </span>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-text-primary flex items-center gap-2">
                                            <span>أكثر 4 حروف من الأمام (قدام المقطع)</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold">
                                                السوابق
                                            </span>
                                        </h3>
                                        <p className="text-xs text-text-secondary">
                                            الحروف التي تسبق المقطع «{appliedSyllable}» مباشرة في بداية أو وسط الكلمة
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                                        {analysisResult.totalBeforeCount.toLocaleString('ar-SA')} موضعاً
                                    </span>
                                    <span className="text-[10px] text-text-muted">إجمالي السوابق</span>
                                </div>
                            </div>

                            {analysisResult.top4Before.length === 0 ? (
                                <div className="p-8 text-center text-text-muted text-xs">
                                    لم يعثر على حروف ملتصقة من الأمام بالمقطع «{appliedSyllable}».
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {analysisResult.top4Before.map((item, idx) => 
                                        renderLetterCard(item, idx, 'before', FRONT_RANK_CONFIGS)
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: BACK (4 حروف من الخلف - اللواحق) */}
                        <div className="bg-surface rounded-2xl border-2 border-amber-500/30 p-5 md:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                                        <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                                    </span>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-text-primary flex items-center gap-2">
                                            <span>أكثر 4 حروف من الخلف (ورى المقطع)</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                                اللواحق
                                            </span>
                                        </h3>
                                        <p className="text-xs text-text-secondary">
                                            الحروف التي تأتي بعد المقطع «{appliedSyllable}» مباشرة في وسط أو نهاية الكلمة
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left">
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                                        {analysisResult.totalAfterCount.toLocaleString('ar-SA')} موضعاً
                                    </span>
                                    <span className="text-[10px] text-text-muted">إجمالي اللواحق</span>
                                </div>
                            </div>

                            {analysisResult.top4After.length === 0 ? (
                                <div className="p-8 text-center text-text-muted text-xs">
                                    لم يعثر على حروف ملتصقة من الخلف بالمقطع «{appliedSyllable}».
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {analysisResult.top4After.map((item, idx) => 
                                        renderLetterCard(item, idx, 'after', BACK_RANK_CONFIGS)
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE MODE: FRONT ONLY */}
            {viewOption === 'front_only' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    <ArrowRightIcon className="w-5 h-5 rotate-180" />
                                </span>
                                <span>أكثر 4 حروف من الأمام (قدام المقطع «{appliedSyllable}»)</span>
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">
                                الحروف السابقة الأكثر اتصالاً بالمقطع قبل بدايته مباشرة، مرتبة تنازلياً حسب التكرار
                            </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            إجمالي السوابق: {analysisResult.totalBeforeCount} موضعاً
                        </span>
                    </div>

                    {analysisResult.top4Before.length === 0 ? (
                        <div className="bg-surface rounded-2xl border border-border-default p-8 text-center text-text-muted">
                            لم يتم العثور على حروف سابقة للمقطع «{appliedSyllable}».
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {analysisResult.top4Before.map((item, idx) => 
                                renderLetterCard(item, idx, 'before', FRONT_RANK_CONFIGS)
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* SINGLE MODE: BACK ONLY */}
            {viewOption === 'back_only' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                                </span>
                                <span>أكثر 4 حروف من الخلف (ورى المقطع «{appliedSyllable}»)</span>
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">
                                الحروف اللاحقة الأكثر اتصالاً بالمقطع بعد نهايته مباشرة، مرتبة تنازلياً حسب التكرار
                            </p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            إجمالي اللواحق: {analysisResult.totalAfterCount} موضعاً
                        </span>
                    </div>

                    {analysisResult.top4After.length === 0 ? (
                        <div className="bg-surface rounded-2xl border border-border-default p-8 text-center text-text-muted">
                            لم يتم العثور على حروف لاحقة للمقطع «{appliedSyllable}».
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {analysisResult.top4After.map((item, idx) => 
                                renderLetterCard(item, idx, 'after', BACK_RANK_CONFIGS)
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* SINGLE MODE: COMBINED RANK */}
            {viewOption === 'combined_rank' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    <SparklesIcon className="w-5 h-5" />
                                </span>
                                <span>الترتيب المجمّع لأكثر 4 حروف التصاقاً بالمقطع «{appliedSyllable}»</span>
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">
                                مجموع مرات الالتصاق كـ (سابق ولاحق) معاً في كلمات القرآن الكريم
                            </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            إجمالي الروابط: {analysisResult.totalAttachmentsCount}
                        </span>
                    </div>

                    {analysisResult.top4.length === 0 ? (
                        <div className="bg-surface rounded-2xl border border-border-default p-8 text-center text-text-muted">
                            لم يتم العثور على حروف ملتصقة بالمقطع «{appliedSyllable}».
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {analysisResult.top4.map((item, idx) => 
                                renderLetterCard(item, idx, 'both', BACK_RANK_CONFIGS)
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* FULL ALPHABET ATTACHMENTS TABLE / ROW */}
            {analysisResult.allLetters.length > 4 && (
                <div className="bg-surface rounded-2xl border border-border-default p-5 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <span>باقي الحروف الملتصقة بمقطع «{appliedSyllable}» حسب وتيرة التردد:</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary border border-border-subtle">
                                {analysisResult.allLetters.length} حرفاً إجمالاً
                            </span>
                        </h3>

                        <span className="text-xs text-text-muted">
                            اضغط على أي حرف لتصفية الآيات وعرض مواضعه
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {analysisResult.allLetters.map((item, idx) => {
                            const isSelected = activeFilter?.letter === item.letter;
                            return (
                                <button
                                    key={item.letter}
                                    type="button"
                                    onClick={() => handleLetterCardClick(item.letter, 'any')}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                                        isSelected
                                            ? 'bg-primary/15 border-primary text-primary font-bold shadow-xs'
                                            : 'bg-surface-subtle hover:bg-surface border-border-default hover:border-text-muted text-text-secondary'
                                    }`}
                                >
                                    <span className="text-text-muted font-mono text-[10px]">#{idx + 1}</span>
                                    <span className="font-amiri text-base font-bold text-text-primary">{item.letter}</span>
                                    <span className="text-[11px] text-text-muted font-bold">
                                        ({item.totalCount})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SURAH DISTRIBUTION BREAKDOWN */}
            {analysisResult.surahDistribution.length > 0 && (
                <div className="bg-surface rounded-2xl border border-border-default p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-primary">
                            أكثر السور القرآنية وروداً للمقطع «{appliedSyllable}» ومفرداته:
                        </h3>
                        {selectedSurah && (
                            <button
                                type="button"
                                onClick={() => setSelectedSurah(undefined)}
                                className="text-xs text-primary font-bold hover:underline cursor-pointer"
                            >
                                إلغاء حصر السورة (عرض الكل)
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {analysisResult.surahDistribution.slice(0, 6).map((s, sIdx) => (
                            <div 
                                key={s.surahNumber}
                                onClick={() => {
                                    setSelectedSurah(s.surahNumber);
                                    setActiveFilter(null);
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
                                    selectedSurah === s.surahNumber
                                        ? 'bg-primary/10 border-primary text-primary font-bold'
                                        : 'bg-surface-subtle hover:bg-surface border-border-default'
                                }`}
                                title="اضغط لحصر التحليل في هذه السورة"
                            >
                                <span className="text-[10px] text-text-muted block">#{sIdx + 1}</span>
                                <span className="font-bold text-xs md:text-sm text-text-primary block truncate">
                                    سورة {s.surahName}
                                </span>
                                <span className="text-xs text-primary font-bold block mt-1">
                                    {s.count} موضعاً
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VERSES AND MATCHING WORDS EXPLORER */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                            <span>استعراض المواضع والآيات القرآنية</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {filteredMatches.length.toLocaleString('ar-SA')} موضعاً
                            </span>
                        </h2>
                        <p className="text-xs text-text-secondary mt-0.5">
                            {activeFilter ? (
                                <>
                                    تمت التصفية بحرف{' '}
                                    <span className="font-bold text-primary">
                                        «{activeFilter.letter}»
                                    </span>{' '}
                                    {activeFilter.position === 'before' ? (
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            (من الأمام - سابق قبل المقطع «{appliedSyllable}»)
                                        </span>
                                    ) : activeFilter.position === 'after' ? (
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                            (من الخلف - لاحق بعد المقطع «{appliedSyllable}»)
                                        </span>
                                    ) : (
                                        <span>(متصل بالمقطع «{appliedSyllable}»)</span>
                                    )}
                                </>
                            ) : (
                                <>عرض جميع الكلمات والمواضع القرآنية الحاوية للمقطع «{appliedSyllable}».</>
                            )}
                        </p>
                    </div>

                    {/* Filter Search Input */}
                    <div className="w-full sm:w-64 relative">
                        <input
                            type="text"
                            value={verseSearchQuery}
                            onChange={(e) => setVerseSearchQuery(e.target.value)}
                            placeholder="بحث في الآيات أو الكلمات..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-subtle border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                        />
                        {verseSearchQuery && (
                            <button
                                type="button"
                                onClick={() => setVerseSearchQuery('')}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                            >
                                <ClearIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Verses List */}
                {filteredMatches.length === 0 ? (
                    <div className="p-12 text-center text-text-muted space-y-2">
                        <p className="text-sm">لا توجد آيات مطابقة للشروط المحددة.</p>
                        {activeFilter && (
                            <button
                                type="button"
                                onClick={() => setActiveFilter(null)}
                                className="text-xs text-primary font-bold underline cursor-pointer"
                            >
                                إلغاء تصفية الحرف وعرض كافة النتائج ({analysisResult.matches.length})
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMatches.slice(0, visibleVersesCount).map((match) => {
                            const isCopied = copiedAyahId === match.id;

                            return (
                                <div
                                    key={match.id}
                                    className="p-4 md:p-5 rounded-xl bg-surface-subtle border border-border-default hover:border-border-muted transition-colors space-y-3"
                                >
                                    {/* Ayah Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-text-primary px-2.5 py-0.5 rounded-lg bg-surface border border-border-subtle">
                                                سورة {match.surahName} : الآية {match.ayahNumber}
                                            </span>
                                            
                                            {match.attachedBefore && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold flex items-center gap-1">
                                                    <span>قدام:</span>
                                                    <span className="font-amiri text-sm">{match.attachedBefore}</span>
                                                </span>
                                            )}

                                            {match.attachedAfter && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
                                                    <span>ورى:</span>
                                                    <span className="font-amiri text-sm">{match.attachedAfter}</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`#/surah/${match.surahNumber}?ayah=${match.ayahNumber}`}
                                                className="px-2.5 py-1 rounded bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold"
                                            >
                                                <BookOpenIcon className="w-3.5 h-3.5" />
                                                <span>فتح في المصحف</span>
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => handleCopy(match.ayahText, match.surahName, match.ayahNumber, match.id)}
                                                className="p-1 rounded bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                                title="نسخ الآية الكريمة"
                                            >
                                                {isCopied ? (
                                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <CopyIcon className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Highlighted Word Focus Card */}
                                    <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-border-subtle">
                                        <span className="text-xs text-text-muted font-bold">المفردة في موضعها:</span>
                                        <span className="font-amiri text-xl font-bold text-text-primary px-3 py-0.5 rounded bg-surface-subtle border border-border-default">
                                            {match.originalWord}
                                        </span>

                                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                            {match.attachedBefore && (
                                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                                    سابق: «{match.attachedBefore}»
                                                </span>
                                            )}
                                            {match.attachedAfter && (
                                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                                    لاحق: «{match.attachedAfter}»
                                                </span>
                                            )}
                                        </div>

                                        {onSearch && (
                                            <button
                                                type="button"
                                                onClick={() => onSearch(match.originalWord, 'quran-simple-clean')}
                                                className="text-xs text-primary hover:underline font-bold cursor-pointer mr-auto"
                                            >
                                                بحث عن المفردة ←
                                            </button>
                                        )}
                                    </div>

                                    {/* Ayah Text */}
                                    <p className="font-amiri text-lg md:text-xl text-text-primary leading-loose text-justify pt-1" dir="rtl">
                                        {match.ayahText.split(/\s+/).map((w, wIdx) => {
                                            const isMatchWord = wIdx === match.wordIndex;
                                            return (
                                                <span
                                                    key={wIdx}
                                                    className={
                                                        isMatchWord
                                                            ? 'inline-block mx-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-400/40 shadow-xs'
                                                            : 'mx-0.5'
                                                    }
                                                >
                                                    {w}
                                                </span>
                                            );
                                        })}
                                        <span className="text-text-muted font-sans text-xs mr-2 font-bold">
                                            ﴿{match.ayahNumber}﴾
                                        </span>
                                    </p>
                                </div>
                            );
                        })}

                        {/* Pagination / Load More */}
                        {filteredMatches.length > visibleVersesCount && (
                            <div className="pt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setVisibleVersesCount(prev => prev + 30)}
                                    className="px-6 py-2.5 bg-surface hover:bg-surface-subtle border border-border-default rounded-xl font-bold text-xs md:text-sm text-text-primary transition-colors cursor-pointer shadow-xs"
                                >
                                    عرض 30 موضعاً إضافياً (متبقي {filteredMatches.length - visibleVersesCount})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyllableClusterView;
