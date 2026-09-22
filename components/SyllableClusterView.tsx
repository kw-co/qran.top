import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { 
    analyzeSyllableAttachments, 
    ALL_ARABIC_LETTERS,
    AttachedLetterStats 
} from '../utils/syllableAttachment';
import { 
    SparklesIcon, 
    ChevronLeftIcon,
    ArrowRightIcon,
    ArrowLeftIcon
} from './icons';

interface SyllableClusterViewProps {
    simpleCleanData: SurahData[];
    onSearch?: (word: string, sourceEdition?: string) => void;
}

type DirectionFilter = 'all' | 'before' | 'after';

export const SyllableClusterView: React.FC<SyllableClusterViewProps> = ({ 
    simpleCleanData,
    onSearch 
}) => {
    // 1. Single Letter State (Default: 'ح' as requested in example)
    const [selectedLetter, setSelectedLetter] = useState<string>('ح');
    const [selectedSurah, setSelectedSurah] = useState<number | undefined>(undefined);
    const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 2. Perform fast analysis without storing heavy match objects
    const analysisResult = useMemo(() => {
        return analyzeSyllableAttachments(
            simpleCleanData,
            selectedLetter,
            'all_adjacent',
            selectedSurah,
            false // includeMatches = false to prevent heavy DOM and speed up calculation
        );
    }, [simpleCleanData, selectedLetter, selectedSurah]);

    // Choose active top 10 list based on direction filter
    const activeTop10: AttachedLetterStats[] = useMemo(() => {
        if (directionFilter === 'before') {
            return analysisResult.top10Before;
        } else if (directionFilter === 'after') {
            return analysisResult.top10After;
        }
        return analysisResult.top10;
    }, [analysisResult, directionFilter]);

    // Max count for calculating progress bar width
    const maxCount = useMemo(() => {
        if (activeTop10.length === 0) return 1;
        return activeTop10[0].totalCount || 1;
    }, [activeTop10]);

    // Handle direct character input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        if (!val) return;
        // Take the last or first valid Arabic letter
        const arabicMatch = val.match(/[\u0621-\u064A]/);
        if (arabicMatch) {
            setSelectedLetter(arabicMatch[0]);
        }
    };

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

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>تحليل اتصال الحروف القرآنية</span>
                </div>
            </div>

            {/* Header & Single-Letter Selection */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex">
                                <SparklesIcon className="w-7 h-7" />
                            </span>
                            <span>أكثر 10 أحرف اتصالاً بحرف «{selectedLetter}»</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                            اختر أي حرف من حروف الهجاء أدناه لمعرفة الحروف العشرة الأكثر التصاقاً واقتراناً به (سواء من قبله أو من بعده) عبر كلمات القرآن الكريم كاملة.
                        </p>
                    </div>

                    {/* Surah Filter Dropdown */}
                    <div className="w-full md:w-56 space-y-1">
                        <label className="text-xs font-bold text-text-secondary block">
                            نطاق البحث:
                        </label>
                        <select
                            value={selectedSurah || ''}
                            onChange={(e) => setSelectedSurah(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full py-2 px-3 bg-surface-subtle border border-border-default rounded-xl text-xs md:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                            <option value="">كامل المصحف (114 سورة)</option>
                            {QURAN_INDEX.map((s) => (
                                <option key={s.number} value={s.number}>
                                    سورة {s.name} ({s.number})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 28 Arabic Alphabet Quick Picker */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-muted">
                            اختر الحرف المراد تحليله بنقرة واحدة:
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">أو اكتب الحرف:</span>
                            <input
                                type="text"
                                maxLength={2}
                                value={selectedLetter}
                                onChange={handleInputChange}
                                className="w-10 h-8 text-center bg-surface-subtle border border-border-default rounded-lg font-amiri text-lg font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-start">
                        {ALL_ARABIC_LETTERS.map(({ letter, name }) => {
                            const isCurrent = selectedLetter === letter;
                            return (
                                <button
                                    key={letter}
                                    type="button"
                                    onClick={() => setSelectedLetter(letter)}
                                    title={`حرف ${name}`}
                                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-amiri text-xl md:text-2xl font-bold transition-all cursor-pointer flex items-center justify-center ${
                                        isCurrent
                                            ? 'bg-primary text-white shadow-md scale-105 ring-2 ring-primary/40 font-black'
                                            : 'bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary'
                                    }`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">مرات ورود حرف «{selectedLetter}»</span>
                    <span className="text-xl md:text-2xl font-bold text-text-primary">
                        {analysisResult.totalOccurrences.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">في الكلمات القرآنية</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center">
                    <span className="text-xs text-text-muted font-medium block mb-1">إجمالي صلات الالتصاق</span>
                    <span className="text-xl md:text-2xl font-bold text-primary">
                        {analysisResult.totalAttachmentsCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">صلة بحروف مجاورة</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-blue-500">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">ملتصقة من قبل (سوابق)</span>
                    <span className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analysisResult.totalBeforeCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">تسبق حرف «{selectedLetter}» مباشرة</span>
                </div>

                <div className="bg-surface rounded-xl border border-border-default p-4 text-center border-l-4 border-l-amber-500">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">ملتصقة من بعد (لواحق)</span>
                    <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {analysisResult.totalAfterCount.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[11px] text-text-secondary block mt-0.5">تلي حرف «{selectedLetter}» مباشرة</span>
                </div>
            </div>

            {/* Direction Filter Tabs */}
            <div className="bg-surface rounded-2xl border border-border-default p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted font-bold ml-1">نوع الاتصال:</span>

                    <button
                        type="button"
                        onClick={() => setDirectionFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            directionFilter === 'all'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>🔀</span>
                        <span>سواء من قبل أو من بعد (الكل)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDirectionFilter('before')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            directionFilter === 'after'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 rotate-180" />
                        <span>من بعد فقط (اللواحق)</span>
                    </button>
                </div>

                <span className="text-xs text-text-muted font-medium mr-auto md:mr-0">
                    أعلى 10 أحرف الأكثر تكراراً
                </span>
            </div>

            {/* THE TOP 10 CONNECTED LETTERS (CLEAN, NO NOISE) */}
            <div className="bg-surface rounded-2xl border border-border-default p-5 md:p-6 shadow-sm space-y-4">
                <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
                            <span>قائمة أكثر 10 أحرف اتصالاً بحرف «{selectedLetter}»</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                {directionFilter === 'before' ? 'من قبل (السوابق)' : directionFilter === 'after' ? 'من بعد (اللواحق)' : 'من قبل ومن بعد معاً'}
                            </span>
                        </h2>
                    </div>
                </div>

                {activeTop10.length === 0 ? (
                    <div className="py-12 text-center text-text-muted">
                        لا توجد أحرف متصلة مسجلة لهذا الحرف وفق النطاق المختار.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeTop10.map((item, idx) => {
                            const rank = idx + 1;
                            const isTop3 = rank <= 3;
                            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                            const barPercent = Math.round((item.totalCount / maxCount) * 100);

                            return (
                                <div
                                    key={item.letter}
                                    className={`p-4 md:p-5 rounded-2xl border transition-all duration-150 ${
                                        isTop3
                                            ? 'bg-surface-subtle/80 border-border-default shadow-xs'
                                            : 'bg-surface border-border-subtle hover:border-border-default'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Rank & Letter Name */}
                                        <div className="flex items-center gap-3 md:gap-4 min-w-[200px]">
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

                                            {/* Letter Title */}
                                            <div>
                                                <h3 className="font-bold text-sm md:text-base text-text-primary">
                                                    حرف {item.letterName}
                                                </h3>
                                                <span className="text-xs text-text-muted">
                                                    {item.percentage}% من إجمالي الصلات
                                                </span>
                                            </div>
                                        </div>

                                        {/* Breakdown: Before vs After */}
                                        <div className="flex items-center gap-4 text-xs shrink-0">
                                            <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                                                <span className="font-medium text-text-muted ml-1">من قبل:</span>
                                                <span className="font-bold font-mono text-sm">{item.beforeCount.toLocaleString('ar-SA')}</span>
                                            </div>

                                            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                                                <span className="font-medium text-text-muted ml-1">من بعد:</span>
                                                <span className="font-bold font-mono text-sm">{item.afterCount.toLocaleString('ar-SA')}</span>
                                            </div>

                                            <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                                <span className="font-medium text-text-muted ml-1">المجموع:</span>
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
                                            className="bg-primary h-full rounded-full transition-all duration-300"
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
