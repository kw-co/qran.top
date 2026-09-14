import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClearIcon, CheckIcon } from '../icons';
import FormattedDiacriticWord from './FormattedDiacriticWord';

export interface PhraseFilterItem {
    phrase: string;
    count: number;
}

export interface DiacriticVariantItem {
    word: string;
    count: number;
}

export interface SearchFiltersDrawerProps {
    phraseFilters: PhraseFilterItem[];
    activePhraseFilter: string;
    setActivePhraseFilter: (filter: string) => void;
    diacriticVariants: DiacriticVariantItem[];
    activeDiacriticFilter: string;
    setActiveDiacriticFilter: (filter: string) => void;
    resultsCount: number;
    activeTab?: 'phrases' | 'diacritics';
    onTabChange?: (tab: 'phrases' | 'diacritics') => void;
    sortOrder?: 'alpha' | 'freq';
    onSortOrderChange?: (sort: 'alpha' | 'freq') => void;
}

export const SearchFiltersDrawer: React.FC<SearchFiltersDrawerProps> = ({
    phraseFilters,
    activePhraseFilter,
    setActivePhraseFilter,
    diacriticVariants,
    activeDiacriticFilter,
    setActiveDiacriticFilter,
    resultsCount,
    activeTab: externalActiveTab,
    onTabChange,
    sortOrder: externalSortOrder,
    onSortOrderChange,
}) => {
    const hasPhrases = phraseFilters.length > 0;
    const hasDiacritics = diacriticVariants.length >= 2;

    // Internal state with sync to optional external props
    const [internalTab, setInternalTab] = useState<'phrases' | 'diacritics'>('phrases');
    const [internalSort, setInternalSort] = useState<'alpha' | 'freq'>('alpha');
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    
    // Zoom control for diacritic words in chips (default: large)
    const [diacriticFontSize, setDiacriticFontSize] = useState<'md' | 'lg' | 'xl'>('lg');

    const activeTab = externalActiveTab || internalTab;
    const sortOrder = externalSortOrder || internalSort;

    const handleTabChange = (tab: 'phrases' | 'diacritics') => {
        setInternalTab(tab);
        if (onTabChange) onTabChange(tab);
    };

    const handleSortChange = (sort: 'alpha' | 'freq') => {
        setInternalSort(sort);
        if (onSortOrderChange) onSortOrderChange(sort);
    };

    // Active phrase filter tokens
    const currentPhraseFilters = activePhraseFilter === 'all' || !activePhraseFilter
        ? []
        : activePhraseFilter.split(',').map(s => s.trim()).filter(Boolean);

    const togglePhrase = (phrase: string) => {
        if (currentPhraseFilters.includes(phrase)) {
            const next = currentPhraseFilters.filter(p => p !== phrase);
            setActivePhraseFilter(next.length === 0 ? 'all' : next.join(','));
        } else {
            const next = [...currentPhraseFilters, phrase];
            setActivePhraseFilter(next.join(','));
        }
    };

    // Active diacritic filter tokens
    const currentDiacriticFilters = !activeDiacriticFilter || activeDiacriticFilter.trim() === ''
        ? []
        : activeDiacriticFilter.split(',').map(s => s.trim()).filter(Boolean);

    const toggleDiacritic = (word: string) => {
        if (currentDiacriticFilters.includes(word)) {
            const next = currentDiacriticFilters.filter(p => p !== word);
            setActiveDiacriticFilter(next.join(','));
        } else {
            const next = [...currentDiacriticFilters, word];
            setActiveDiacriticFilter(next.join(','));
        }
    };

    const isPhraseActive = currentPhraseFilters.length > 0;
    const isDiacriticActive = currentDiacriticFilters.length > 0;
    const hasAnyActiveFilter = isPhraseActive || isDiacriticActive;

    // Sort phrases: Default is ALPHABETICAL (أ - ي)
    const sortedPhrases = useMemo(() => {
        const copy = [...phraseFilters];
        if (sortOrder === 'alpha') {
            return copy.sort((a, b) => a.phrase.localeCompare(b.phrase, 'ar'));
        } else {
            return copy.sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase, 'ar'));
        }
    }, [phraseFilters, sortOrder]);

    // Sort diacritics: Default is ALPHABETICAL (أ - ي)
    const sortedDiacritics = useMemo(() => {
        const copy = [...diacriticVariants];
        if (sortOrder === 'alpha') {
            return copy.sort((a, b) => a.word.localeCompare(b.word, 'ar'));
        } else {
            return copy.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'ar'));
        }
    }, [diacriticVariants, sortOrder]);

    // If neither filter is relevant, do not render (AFTER all hooks)
    if (!hasPhrases && !hasDiacritics) {
        return null;
    }

    // Effective active tab fallback if current tab has no items
    const effectiveTab: 'phrases' | 'diacritics' = 
        (activeTab === 'phrases' && !hasPhrases && hasDiacritics) ? 'diacritics' :
        (activeTab === 'diacritics' && !hasDiacritics && hasPhrases) ? 'phrases' : activeTab;

    const activeListCount = effectiveTab === 'phrases' ? sortedPhrases.length : sortedDiacritics.length;

    // Determine font size classes based on diacriticFontSize state
    const diacriticTextClass = 
        diacriticFontSize === 'xl' ? 'text-2xl sm:text-3xl' :
        diacriticFontSize === 'md' ? 'text-lg sm:text-xl' :
        'text-xl sm:text-2xl';

    return (
        <div className="mb-5 pb-4 border-b border-border-default/80">
            {/* Top Bar: Tabs + Active Badges + Expand Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border-default rounded-xl">
                    {hasPhrases && (
                        <button
                            type="button"
                            onClick={() => handleTabChange('phrases')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                effectiveTab === 'phrases'
                                    ? 'bg-surface text-primary shadow-2xs border border-border-default'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <span>التراكيب والسياقات</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                effectiveTab === 'phrases' ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-text-muted'
                            }`}>
                                {phraseFilters.length}
                            </span>
                            {isPhraseActive && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="فلتر مفعّل" />
                            )}
                        </button>
                    )}

                    {hasDiacritics && (
                        <button
                            type="button"
                            onClick={() => handleTabChange('diacritics')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                effectiveTab === 'diacritics'
                                    ? 'bg-surface text-primary shadow-2xs border border-border-default'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <span>صيغ التشكيل</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                effectiveTab === 'diacritics' ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-text-muted'
                            }`}>
                                {diacriticVariants.length}
                            </span>
                            {isDiacriticActive && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="فلتر مفعّل" />
                            )}
                        </button>
                    )}
                </div>

                {/* Right controls: Reset + Expand/Collapse Button */}
                <div className="flex items-center gap-2">
                    {hasAnyActiveFilter && (
                        <button
                            type="button"
                            onClick={() => {
                                setActivePhraseFilter('all');
                                setActiveDiacriticFilter('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            title="إلغاء جميع الفلاتر والعودة لكامل النتائج"
                        >
                            <ClearIcon className="w-3.5 h-3.5" />
                            <span>إلغاء الفلتر</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default bg-surface hover:bg-surface-hover text-xs font-bold text-text-primary transition-all cursor-pointer shadow-2xs"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'طي سحاب الفلاتر' : 'توسيع سحاب الفلاتر'}
                    >
                        <span>{isExpanded ? 'طي السحاب' : `سحاب الفلاتر (${activeListCount})`}</span>
                        {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4 text-primary" />
                        ) : (
                            <ChevronDownIcon className="w-4 h-4 text-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsed Peek Preview (Single line preview so the user immediately understands what options exist) */}
            {!isExpanded && (
                <div className="flex items-center gap-2 flex-wrap min-h-11 overflow-hidden relative pt-0.5">
                    {effectiveTab === 'phrases' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setActivePhraseFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                    currentPhraseFilters.length === 0
                                        ? 'bg-primary text-white font-bold shadow-2xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                كل النتائج ({resultsCount})
                            </button>
                            {sortedPhrases.slice(0, 6).map(({ phrase, count }) => {
                                const isActive = currentPhraseFilters.includes(phrase);
                                return (
                                    <button
                                        key={phrase}
                                        type="button"
                                        onClick={() => togglePhrase(phrase)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                            isActive
                                                ? 'bg-primary text-white font-bold shadow-2xs'
                                                : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                        }`}
                                    >
                                        {isActive && <CheckIcon className="w-3 h-3 text-white" />}
                                        <span>{phrase}</span>
                                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                                    </button>
                                );
                            })}
                            {sortedPhrases.length > 6 && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(true)}
                                    className="text-xs text-primary font-semibold hover:underline px-1 py-1"
                                >
                                    +{sortedPhrases.length - 6} المزيد...
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveDiacriticFilter('')}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    currentDiacriticFilters.length === 0
                                        ? 'bg-primary text-white font-bold shadow-2xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                كل الحالات ({resultsCount})
                            </button>
                            {sortedDiacritics.slice(0, 5).map(({ word, count }) => {
                                const isActive = currentDiacriticFilters.includes(word);
                                return (
                                    <button
                                        key={word}
                                        type="button"
                                        onClick={() => toggleDiacritic(word)}
                                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 border ${
                                            isActive
                                                ? 'bg-primary text-white border-primary shadow-xs ring-1 ring-primary'
                                                : 'bg-surface border-border-default text-text-primary hover:bg-surface-hover hover:border-primary/40'
                                        }`}
                                    >
                                        {isActive && <CheckIcon className="w-3.5 h-3.5 text-white shrink-0" />}
                                        <FormattedDiacriticWord
                                            word={word}
                                            isActive={isActive}
                                            fontSizeClass="text-xl sm:text-2xl"
                                        />
                                        <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono shrink-0 ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted border border-border-default/60'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                            {sortedDiacritics.length > 5 && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(true)}
                                    className="text-xs text-primary font-bold hover:underline px-1 py-1"
                                >
                                    +{sortedDiacritics.length - 5} المزيد...
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Expanded Drawer: The dedicated scrollable rectangle */}
            {isExpanded && (
                <div className="mt-2.5 p-3.5 sm:p-5 bg-surface-subtle/80 border border-border-default rounded-2xl shadow-xs animate-fade-in">
                    {/* Header toolbar inside the expanded box */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border-default/60">
                        {/* Sort Options: Default is Alphabetical */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-text-muted font-medium">ترتيب المفردات:</span>
                            <div className="inline-flex rounded-lg border border-border-default bg-surface p-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleSortChange('alpha')}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        sortOrder === 'alpha'
                                            ? 'bg-primary text-white shadow-2xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    أبجدياً (أ - ي)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSortChange('freq')}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        sortOrder === 'freq'
                                            ? 'bg-primary text-white shadow-2xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    الأكثر تكراراً
                                </button>
                            </div>

                            {/* Font size zoom controls for diacritics */}
                            {effectiveTab === 'diacritics' && (
                                <div className="inline-flex items-center gap-1 mr-2 border-r border-border-default pr-2">
                                    <span className="text-text-muted text-[11px]">حجم الخط:</span>
                                    <div className="inline-flex rounded-md border border-border-default bg-surface p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setDiacriticFontSize('md')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                                diacriticFontSize === 'md' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                            title="حجم خط عادي"
                                        >
                                            عادي
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDiacriticFontSize('lg')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                                diacriticFontSize === 'lg' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                            title="حجم خط كبير (واضح)"
                                        >
                                            كبير
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDiacriticFontSize('xl')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                                diacriticFontSize === 'xl' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                            title="حجم خط فائق الوضوح"
                                        >
                                            فائق
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reset current tab filter */}
                        <div className="flex items-center gap-2">
                            {effectiveTab === 'phrases' && currentPhraseFilters.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActivePhraseFilter('all')}
                                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                                >
                                    إلغاء تحديد التراكيب ({currentPhraseFilters.length})
                                </button>
                            )}
                            {effectiveTab === 'diacritics' && currentDiacriticFilters.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveDiacriticFilter('')}
                                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                                >
                                    إلغاء تحديد التشكيل ({currentDiacriticFilters.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable list of chips */}
                    <div className="max-h-72 sm:max-h-96 overflow-y-auto pr-1 flex flex-wrap gap-2.5 content-start">
                        {effectiveTab === 'phrases' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setActivePhraseFilter('all')}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        currentPhraseFilters.length === 0
                                            ? 'bg-primary text-white font-bold shadow-2xs'
                                            : 'bg-surface border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                    }`}
                                >
                                    عرض كل النتائج ({resultsCount})
                                </button>
                                {sortedPhrases.map(({ phrase, count }) => {
                                    const isActive = currentPhraseFilters.includes(phrase);
                                    return (
                                        <button
                                            key={phrase}
                                            type="button"
                                            onClick={() => togglePhrase(phrase)}
                                            className={`px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
                                                isActive
                                                    ? 'bg-primary text-white font-bold shadow-2xs ring-1 ring-primary'
                                                    : 'bg-surface border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                            }`}
                                        >
                                            {isActive && <CheckIcon className="w-3.5 h-3.5 text-white shrink-0" />}
                                            <span className="text-sm">{phrase}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted border border-border-default/60'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setActiveDiacriticFilter('')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        currentDiacriticFilters.length === 0
                                            ? 'bg-primary text-white font-bold shadow-2xs'
                                            : 'bg-surface border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                    }`}
                                >
                                    عرض كل الحالات ({resultsCount})
                                </button>
                                {sortedDiacritics.map(({ word, count }) => {
                                    const isActive = currentDiacriticFilters.includes(word);
                                    return (
                                        <button
                                            key={word}
                                            type="button"
                                            onClick={() => toggleDiacritic(word)}
                                            className={`px-3.5 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 border shadow-2xs ${
                                                isActive
                                                    ? 'bg-primary text-white border-primary shadow-xs ring-1 ring-primary'
                                                    : 'bg-surface border-border-default text-text-primary hover:bg-surface-hover hover:border-primary/50'
                                            }`}
                                        >
                                            {isActive && <CheckIcon className="w-4 h-4 text-white shrink-0" />}
                                            
                                            <FormattedDiacriticWord
                                                word={word}
                                                isActive={isActive}
                                                fontSizeClass={diacriticTextClass}
                                            />

                                            {/* Dedicated Count Badge */}
                                            <span
                                                className={`px-1.5 py-0.5 rounded-md text-xs font-mono shrink-0 select-none ${
                                                    isActive
                                                        ? 'bg-white/20 text-white font-semibold'
                                                        : 'bg-surface-subtle text-text-secondary border border-border-default/70'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchFiltersDrawer);

