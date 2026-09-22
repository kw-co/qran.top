import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { 
    analyzeSyllableAttachments, 
    ALL_ARABIC_LETTERS,
    POPULAR_SYLLABLE_PRESETS,
    AttachedLetterStats 
} from '../utils/syllableAttachment';
import { 
    SparklesIcon, 
    ChevronLeftIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    SearchIcon,
    ClearIcon,
    CopyIcon,
    CheckIcon
} from './icons';

interface SyllableClusterViewProps {
    simpleCleanData: SurahData[];
    onSearch?: (word: string, sourceEdition?: string) => void;
}

type DirectionFilter = 'all' | 'before' | 'after';
type ViewLimit = 'all' | 'top10' | 'top4';

export const NOORANI_LETTERS_SET = new Set([
    'ا', 'ل', 'م', 'ر', 'ك', 'ه', 'ي', 'ع', 'ص', 'ط', 'س', 'ح', 'ق', 'ن'
]);

interface LetterDisplayItem {
    letter: string;
    letterName: string;
    totalCount: number;
    beforeCount: number;
    afterCount: number;
    percentage: number;
    exampleWords: string[];
    isNoorani: boolean;
}

export const SyllableClusterView: React.FC<SyllableClusterViewProps> = ({ 
    simpleCleanData,
    onSearch 
}) => {
    // 1. Query State: Supports 1 single letter OR multi-letter syllable/word
    const [inputQuery, setInputQuery] = useState<string>('حم');
    const [appliedQuery, setAppliedQuery] = useState<string>('حم');
    const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
    const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
    
    // 2. Options: Hide Noorani letters & View scope
    const [hideNoorani, setHideNoorani] = useState<boolean>(false);
    const [viewLimit, setViewLimit] = useState<ViewLimit>('all');
    const [copied, setCopied] = useState<boolean>(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 3. Fast Quranic Attachment Scanning
    const analysisResult = useMemo(() => {
        const queryToUse = appliedQuery.trim() || 'ح';
        return analyzeSyllableAttachments(
            simpleCleanData,
            queryToUse,
            'all_adjacent',
            selectedSurah,
            false // includeMatches = false to maintain lightning fast performance
        );
    }, [simpleCleanData, appliedQuery, selectedSurah]);

    // 4. Build Full 28-Letter Ordered Ranking
    const all28LettersSorted: LetterDisplayItem[] = useMemo(() => {
        const map = new Map<string, AttachedLetterStats>();
        analysisResult.allLetters.forEach(item => {
            map.set(item.letter, item);
        });

        const totalAttachments = analysisResult.totalAttachmentsCount || 1;
        const totalBefore = analysisResult.totalBeforeCount || 1;
        const totalAfter = analysisResult.totalAfterCount || 1;

        // Map through all 28 canonical Arabic letters
        const items: LetterDisplayItem[] = ALL_ARABIC_LETTERS.map(a => {
            const found = map.get(a.letter);
            const total = found ? found.totalCount : 0;
            const before = found ? found.beforeCount : 0;
            const after = found ? found.afterCount : 0;

            let pct = 0;
            if (directionFilter === 'before') {
                pct = totalBefore > 0 ? Math.round((before / totalBefore) * 1000) / 10 : 0;
            } else if (directionFilter === 'after') {
                pct = totalAfter > 0 ? Math.round((after / totalAfter) * 1000) / 10 : 0;
            } else {
                pct = totalAttachments > 0 ? Math.round((total / totalAttachments) * 1000) / 10 : 0;
            }

            return {
                letter: a.letter,
                letterName: a.name,
                totalCount: total,
                beforeCount: before,
                afterCount: after,
                percentage: pct,
                exampleWords: found ? found.exampleWords : [],
                isNoorani: NOORANI_LETTERS_SET.has(a.letter)
            };
        });

        // Sort descending according to active direction filter
        items.sort((a, b) => {
            if (directionFilter === 'before') {
                if (b.beforeCount !== a.beforeCount) return b.beforeCount - a.beforeCount;
                return b.afterCount - a.afterCount;
            } else if (directionFilter === 'after') {
                if (b.afterCount !== a.afterCount) return b.afterCount - a.afterCount;
                return b.beforeCount - a.beforeCount;
            } else {
                if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
                if (b.beforeCount !== a.beforeCount) return b.beforeCount - a.beforeCount;
                return b.afterCount - a.afterCount;
            }
        });

        return items;
    }, [analysisResult, directionFilter]);

    // 5. Apply "Hide Noorani" and "View Limit" filters
    const displayedLetters = useMemo(() => {
        let list = all28LettersSorted;
        if (hideNoorani) {
            list = list.filter(item => !item.isNoorani);
        }
        if (viewLimit === 'top10') {
            list = list.slice(0, 10);
        } else if (viewLimit === 'top4') {
            list = list.slice(0, 4);
        }
        return list;
    }, [all28LettersSorted, hideNoorani, viewLimit]);

    // 6. Max count for proportional progress bars
    const maxCount = useMemo(() => {
        if (displayedLetters.length === 0) return 1;
        const top = displayedLetters[0];
        if (directionFilter === 'before') return top.beforeCount || 1;
        if (directionFilter === 'after') return top.afterCount || 1;
        return top.totalCount || 1;
    }, [displayedLetters, directionFilter]);

    // Handlers
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputQuery.trim();
        if (trimmed) {
            setAppliedQuery(trimmed);
        }
    };

    const handleSelectSingleLetter = (letter: string) => {
        setInputQuery(letter);
        setAppliedQuery(letter);
    };

    const handleSelectPreset = (preset: string) => {
        setInputQuery(preset);
        setAppliedQuery(preset);
    };

    const handleCopyRanking = () => {
        const lines = [
            `=== ترتيب الحروف الأبجدية المتصلة بـ «${appliedQuery}» ===`,
            `النطاق: ${selectedSurah ? `سورة ${selectedSurah}` : 'كامل المصحف الشريف'}`,
            `نوع الاتصال: ${directionFilter === 'before' ? 'من قبل (السوابق)' : directionFilter === 'after' ? 'من بعد (اللواحق)' : 'من قبل ومن بعد معاً'}`,
            `فلترة الحروف النورانية: ${hideNoorani ? 'مستبعدة (عرض الحروف غير النورانية فقط)' : 'ظاهرة (جميع الحروف الأبجدية)'}`,
            '-------------------------------------------------------'
        ];

        displayedLetters.forEach((item, idx) => {
            const count = directionFilter === 'before' ? item.beforeCount : directionFilter === 'after' ? item.afterCount : item.totalCount;
            const nooraniTag = item.isNoorani ? '[حرف نوراني]' : '[غير نوراني]';
            lines.push(`${idx + 1}. [${item.letter}] (${item.letterName}) - ${count.toLocaleString('ar-SA')} صلة (${item.percentage}%) | قبل: ${item.beforeCount}، بعد: ${item.afterCount} ${nooraniTag}`);
        });

        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isSingleLetter = appliedQuery.trim().length === 1;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl text-text-primary min-h-[80vh] space-y-6" dir="rtl">
            {/* Top Navigation & Breadcrumb */}
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
                    <span>مصفوفة اتصال الحروف والمقاطع القرآنية</span>
                </div>
            </div>

            {/* Header & Controls Panel */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex">
                                <SparklesIcon className="w-7 h-7" />
                            </span>
                            <span>
                                ترتيب الحروف الأبجدية المتصلة بـ {isSingleLetter ? 'حرف' : 'مقطع'} «{appliedQuery}»
                            </span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl">
                            تحليل استقرائي لكافة كلمات المصحف يرتب <strong>جميع الحروف الأبجدية الـ 28</strong> تصاعدياً وتنازلياً حسب قوة اتصالها وتلاصقها بـ «{appliedQuery}» (سوابق ولواحق)، مع إمكانية <strong>استبعاد الحروف النورانية</strong> للتركيز على باقي الحروف.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {/* Copy Ranking Button */}
                        <button
                            type="button"
                            onClick={handleCopyRanking}
                            className="py-2.5 px-4 bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">تم النسخ بنجاح</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-4 h-4 text-text-muted" />
                                    <span>نسخ ترتيب الحروف</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Scope & Surah Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border-subtle">
                    {/* Surah Scope */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary block">
                            نطاق السور:
                        </label>
                        <select
                            value={selectedSurah || ''}
                            onChange={(e) => setSelectedSurah(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full py-2 px-3 bg-surface-subtle border border-border-default rounded-xl text-xs md:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                            <option value="">كامل المصحف الشريف (114 سورة)</option>
                            {QURAN_INDEX.map((s) => (
                                <option key={s.number} value={s.number}>
                                    سورة {s.name} ({s.number})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* View Limit (All / 10 / 4) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary block">
                            عدد الحروف المعروضة:
                        </label>
                        <select
                            value={viewLimit}
                            onChange={(e) => setViewLimit(e.target.value as ViewLimit)}
                            className="w-full py-2 px-3 bg-surface-subtle border border-border-default rounded-xl text-xs md:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                            <option value="all">جميع الحروف الأبجدية ({hideNoorani ? '14 حرفاً' : '28 حرفاً'})</option>
                            <option value="top10">أعلى 10 أحرف فقط</option>
                            <option value="top4">أعلى 4 أحرف فقط</option>
                        </select>
                    </div>

                    {/* HIDE NOORANI OPTION (AS REQUESTED) */}
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/30 flex flex-col justify-center space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer select-none">
                            <span className="flex items-center gap-1.5">
                                <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span>إخفاء الأحرف النورانية (14 حرفاً):</span>
                            </span>
                            <input
                                type="checkbox"
                                checked={hideNoorani}
                                onChange={(e) => setHideNoorani(e.target.checked)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer accent-amber-600"
                            />
                        </label>
                        <p className="text-[11px] text-text-muted leading-tight">
                            {hideNoorani 
                                ? 'يتم الآن عرض الحروف غير النورانية فقط (ب، ت، ث، ج، خ، د، ذ، ز، ش، ض، ظ، غ، ف، و)' 
                                : 'مفعل لعرض كامل الأبجدية، حدد المربع لاستبعاد الحروف النورانية.'}
                        </p>
                    </div>
                </div>

                {/* Text Input Form (Type 1 letter or more) */}
                <form onSubmit={handleFormSubmit} className="pt-2 border-t border-border-subtle">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                placeholder="اكتب حرفاً واحداً أو مقطعاً (مثال: حم، الم، يس، طه، ح، م، سبح...)"
                                className="w-full py-2.5 px-4 pr-4 pl-10 bg-surface-subtle border border-border-default rounded-xl text-base md:text-lg font-amiri font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                                dir="rtl"
                            />
                            {inputQuery && (
                                <button
                                    type="button"
                                    onClick={() => setInputQuery('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                    title="مسح"
                                >
                                    <ClearIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs text-sm"
                        >
                            <SearchIcon className="w-4 h-4" />
                            <span>تحليل الاتصال</span>
                        </button>
                    </div>
                </form>

                {/* 28 Arabic Alphabet Quick Picker */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <span className="text-xs font-bold text-text-muted block">
                        أو اختر حرفاً مفرداً بنقرة واحدة:
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                        {ALL_ARABIC_LETTERS.map(({ letter, name }) => {
                            const isCurrent = appliedQuery === letter;
                            const isNoorani = NOORANI_LETTERS_SET.has(letter);
                            return (
                                <button
                                    key={letter}
                                    type="button"
                                    onClick={() => handleSelectSingleLetter(letter)}
                                    title={`حرف ${name} ${isNoorani ? '(نوراني)' : ''}`}
                                    className={`w-8 h-8 md:w-9 md:h-9 rounded-xl font-amiri text-lg md:text-xl font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                                        isCurrent
                                            ? 'bg-primary text-white shadow-md scale-105 ring-2 ring-primary/40 font-black'
                                            : isNoorani
                                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                                : 'bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary'
                                    }`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Popular Multi-Letter Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
                    <span className="text-xs text-text-muted font-bold ml-1">مقاطع شائعة:</span>
                    {POPULAR_SYLLABLE_PRESETS.map((p) => {
                        const isCurrent = appliedQuery === p.syllable;
                        return (
                            <button
                                key={p.syllable}
                                type="button"
                                onClick={() => handleSelectPreset(p.syllable)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    isCurrent
                                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400 font-extrabold shadow-2xs'
                                        : 'bg-surface-subtle hover:bg-surface text-text-secondary border-border-default hover:border-text-muted'
                                }`}
                            >
                                {p.title}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">
                        مرات ورود «{appliedQuery}»
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-text-primary font-mono">
                        {analysisResult.totalOccurrences.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">في الكلمات القرآنية</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">إجمالي صلات الالتصاق</span>
                    <span className="text-xl md:text-2xl font-bold text-primary font-mono">
                        {analysisResult.totalAttachmentsCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">صلة بحروف مجاورة</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-blue-500">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">صلات من قبل (سوابق)</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {analysisResult.totalBeforeCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">تسبق «{appliedQuery}» مباشرة</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-amber-500">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">صلات من بعد (لواحق)</span>
                    <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {analysisResult.totalAfterCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">تلي «{appliedQuery}» مباشرة</span>
                </div>
            </div>

            {/* Direction Filter Tabs & Summary Row */}
            <div className="bg-surface rounded-2xl border border-border-default p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted font-bold ml-1">جهة الاتصال:</span>

                    <button
                        type="button"
                        onClick={() => setDirectionFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            directionFilter === 'all'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>🔀</span>
                        <span>إجمالي الاتصال (سوابق + لواحق)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDirectionFilter('before')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            directionFilter === 'before'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                        <span>من قبل فقط (السوابق)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDirectionFilter('after')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            directionFilter === 'after'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 rotate-180" />
                        <span>من بعد فقط (اللواحق)</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border-default text-text-secondary font-medium">
                        المعروض: <strong className="text-text-primary font-mono">{displayedLetters.length}</strong> حرفاً
                    </span>
                    {hideNoorani && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold">
                            مستبعد: 14 حرفاً نورانياً
                        </span>
                    )}
                </div>
            </div>

            {/* COMPACT MATRIX OVERVIEW (ALL LETTERS AT A GLANCE) */}
            <div className="bg-surface rounded-2xl border border-border-default p-4 md:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                    <span>نظرة مصفوفية سريعة على ترتيب الحروف:</span>
                    <span>انقر على أي حرف للانتقال إليه في القائمة</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {displayedLetters.map((item, idx) => {
                        const rank = idx + 1;
                        const count = directionFilter === 'before' ? item.beforeCount : directionFilter === 'after' ? item.afterCount : item.totalCount;
                        return (
                            <a
                                key={item.letter}
                                href={`#letter-card-${item.letter}`}
                                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all hover:scale-105 ${
                                    item.isNoorani
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                        : 'bg-surface-subtle border-border-default text-text-primary hover:border-primary/50'
                                }`}
                            >
                                <span className="text-[10px] text-text-muted font-mono font-bold">#{rank}</span>
                                <span className="font-amiri text-lg font-bold leading-none">{item.letter}</span>
                                <span className="text-xs font-mono font-bold opacity-80">{count.toLocaleString('ar-SA')}</span>
                            </a>
                        );
                    })}
                </div>
            </div>

            {/* DETAILED RANKED CARDS LIST (ALL 28 LETTERS OR FILTERED) */}
            <div className="bg-surface rounded-2xl border border-border-default p-5 md:p-6 shadow-sm space-y-4">
                <div className="border-b border-border-subtle pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                        <span>قائمة ترتيب الحروف المتصلة بـ «{appliedQuery}»</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            {directionFilter === 'before' ? 'من قبل (السوابق)' : directionFilter === 'after' ? 'من بعد (اللواحق)' : 'من قبل ومن بعد معاً'}
                        </span>
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                            <span>حرف نوراني</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                            <span>حرف غير نوراني</span>
                        </span>
                    </div>
                </div>

                {displayedLetters.length === 0 ? (
                    <div className="py-12 text-center text-text-muted space-y-2">
                        <p>لا توجد حروف تطابق المعايير المختارة.</p>
                        {hideNoorani && (
                            <button
                                type="button"
                                onClick={() => setHideNoorani(false)}
                                className="text-xs text-primary underline cursor-pointer"
                            >
                                إعادة إظهار الحروف النورانية
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedLetters.map((item, idx) => {
                            const rank = idx + 1;
                            const isTop3 = rank <= 3;
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                            
                            const activeCount = directionFilter === 'before' 
                                ? item.beforeCount 
                                : directionFilter === 'after' 
                                    ? item.afterCount 
                                    : item.totalCount;

                            const barPercent = Math.round((activeCount / maxCount) * 100);

                            return (
                                <div
                                    key={item.letter}
                                    id={`letter-card-${item.letter}`}
                                    className={`p-4 md:p-5 rounded-2xl border transition-all duration-150 scroll-mt-20 ${
                                        isTop3
                                            ? 'bg-surface-subtle/80 border-border-default shadow-xs'
                                            : 'bg-surface border-border-subtle hover:border-border-default'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Rank & Letter Name */}
                                        <div className="flex items-center gap-3 md:gap-4 min-w-[220px]">
                                            {/* Rank Badge */}
                                            <span className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shrink-0 ${
                                                rank === 1
                                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400'
                                                    : rank === 2
                                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300'
                                                        : rank === 3
                                                            ? 'bg-amber-700/15 text-amber-800 dark:text-amber-400 border border-amber-600/30'
                                                            : 'bg-surface-subtle text-text-muted border border-border-subtle font-mono'
                                            }`}>
                                                {medal}
                                            </span>

                                            {/* Big Letter Glyph */}
                                            <span className="font-amiri text-4xl md:text-5xl font-bold text-primary leading-none shrink-0 w-10 text-center">
                                                {item.letter}
                                            </span>

                                            {/* Letter Title & Noorani Status */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-sm md:text-base text-text-primary">
                                                        حرف {item.letterName}
                                                    </h3>
                                                    {item.isNoorani ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                                                            نوراني
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-subtle text-text-muted font-medium border border-border-default">
                                                            غير نوراني
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-text-muted block mt-0.5 font-mono">
                                                    {item.percentage}% من صلات هذا النطاق
                                                </span>
                                            </div>
                                        </div>

                                        {/* Breakdown: Before vs After vs Active */}
                                        <div className="flex items-center gap-3 md:gap-4 text-xs shrink-0 flex-wrap sm:flex-nowrap">
                                            <div className={`px-2.5 py-1 rounded-lg border ${
                                                directionFilter === 'before'
                                                    ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-2xs'
                                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                                            }`}>
                                                <span className="font-medium opacity-80 ml-1">من قبل:</span>
                                                <span className="font-bold font-mono text-sm">{item.beforeCount.toLocaleString('ar-SA')}</span>
                                            </div>

                                            <div className={`px-2.5 py-1 rounded-lg border ${
                                                directionFilter === 'after'
                                                    ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-2xs'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                                            }`}>
                                                <span className="font-medium opacity-80 ml-1">من بعد:</span>
                                                <span className="font-bold font-mono text-sm">{item.afterCount.toLocaleString('ar-SA')}</span>
                                            </div>

                                            <div className={`px-3 py-1 rounded-lg border ${
                                                directionFilter === 'all'
                                                    ? 'bg-primary text-white font-bold border-primary-hover shadow-2xs'
                                                    : 'bg-primary/10 border-primary/20 text-primary'
                                            }`}>
                                                <span className="font-medium opacity-80 ml-1">المجموع:</span>
                                                <span className="font-bold font-mono text-sm md:text-base">{item.totalCount.toLocaleString('ar-SA')}</span>
                                            </div>
                                        </div>

                                        {/* Word Examples */}
                                        {item.exampleWords.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 sm:max-w-xs shrink-0">
                                                <span className="text-[11px] text-text-muted block w-full sm:w-auto">
                                                    أمثلة:
                                                </span>
                                                {item.exampleWords.slice(0, 3).map((w, wI) => (
                                                    <span 
                                                        key={wI}
                                                        className="font-amiri text-xs md:text-sm px-2 py-0.5 bg-surface border border-border-default rounded-md text-text-primary font-bold shadow-2xs"
                                                    >
                                                        {w}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtle Relative Progress Bar */}
                                    <div className="mt-3 w-full bg-border-subtle h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                directionFilter === 'before' 
                                                    ? 'bg-blue-600' 
                                                    : directionFilter === 'after' 
                                                        ? 'bg-amber-600' 
                                                        : 'bg-primary'
                                            }`}
                                            style={{ width: `${barPercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyllableClusterView;
