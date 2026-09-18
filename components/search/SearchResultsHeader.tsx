import React, { useState } from 'react';
import type { Ayah } from '../../types';
import { SparklesIcon } from '../icons';
import { QURAN_INDEX } from '../../quranIndex';

// Complete list of all 14 unique Muqatta'at (fawatih) formulas across the 29 surahs in the Holy Quran
const ALL_MUQATTAAT_CONFIG: { letters: string; allSurahs: number[] }[] = [
    { letters: "الم", allSurahs: [2, 3, 29, 30, 31, 32] },
    { letters: "المص", allSurahs: [7] },
    { letters: "الر", allSurahs: [10, 11, 12, 14, 15] },
    { letters: "المر", allSurahs: [13] },
    { letters: "كهيعص", allSurahs: [19] },
    { letters: "طه", allSurahs: [20] },
    { letters: "طسم", allSurahs: [26, 28] },
    { letters: "طس", allSurahs: [27] },
    { letters: "يس", allSurahs: [36] },
    { letters: "ص", allSurahs: [38] },
    { letters: "حم", allSurahs: [40, 41, 43, 44, 45, 46] },
    { letters: "حم عسق", allSurahs: [42] },
    { letters: "ق", allSurahs: [50] },
    { letters: "ن", allSurahs: [68] }
];

const SURAH_MUQATTAAT_MAP: Record<number, string> = {
    2: "الم",
    3: "الم",
    7: "المص",
    10: "الر",
    11: "الر",
    12: "الر",
    13: "المر",
    14: "الر",
    15: "الر",
    19: "كهيعص",
    20: "طه",
    26: "طسم",
    27: "طس",
    28: "طسم",
    29: "الم",
    30: "الم",
    31: "الم",
    32: "الم",
    36: "يس",
    38: "ص",
    40: "حم",
    41: "حم",
    42: "حم عسق",
    43: "حم",
    44: "حم",
    45: "حم",
    46: "حم",
    50: "ق",
    68: "ن"
};

interface SearchResultsHeaderProps {
    searchType: 'text' | 'number';
    query: string;
    correctedQuery?: string;
    targetSurahNumber?: number;
    activeMuqattaatFilter?: string;
    setActiveMuqattaatFilter?: (val: string) => void;
    baseResults?: Ayah[];
    displayedResultsCount: number;
    resultsCount: number;
    isSingleWordSearch: boolean;
    generalOccurrences: number;
    exactOccurrences: number;
    exactMatch: boolean;
    setExactMatch: (value: boolean) => void;
    totalOccurrences: number;
    onJumpToOccurrence: (target: number) => void;
    cachedAnalysisExists: boolean;
    onNewSearch: (query: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number, exactMatch?: boolean) => void;
    isRootSearch?: boolean;
    onToggleRootSearch?: (value: boolean) => void;
    displayedResults?: Ayah[];
    showMuqattaatInSearch?: boolean;
    simpleCleanData?: any[]; // Allow importing SurahData if needed or just any[]
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
    searchType, query, correctedQuery, targetSurahNumber, activeMuqattaatFilter = '', setActiveMuqattaatFilter, baseResults = [], displayedResultsCount, resultsCount,
    isSingleWordSearch, generalOccurrences, exactOccurrences, exactMatch,
    setExactMatch, totalOccurrences, onJumpToOccurrence, 
    cachedAnalysisExists, onNewSearch, isRootSearch = false, onToggleRootSearch,
    displayedResults = [], showMuqattaatInSearch = true, simpleCleanData
}) => {
    const finalQueryForChecks = correctedQuery || query;
    const shouldShowAnalysisButton = finalQueryForChecks.trim().split(/\s+/).filter(Boolean).length === 1 && searchType === 'text';

    const allMuqattaatStats = React.useMemo(() => {
        if (!displayedResults || displayedResults.length === 0) return [];
        const surahNumbers = new Set(displayedResults.map(a => a.surah?.number).filter((n): n is number => !!n));

        const FULL_29_MUQATTAAT = [
            { surah: 2, letters: "الم" }, { surah: 3, letters: "الم" }, { surah: 7, letters: "المص" }, { surah: 10, letters: "الر" },
            { surah: 11, letters: "الر" }, { surah: 12, letters: "الر" }, { surah: 13, letters: "المر" }, { surah: 14, letters: "الر" },
            { surah: 15, letters: "الر" }, { surah: 19, letters: "كهيعص" }, { surah: 20, letters: "طه" }, { surah: 26, letters: "طسم" },
            { surah: 27, letters: "طس" }, { surah: 28, letters: "طسم" }, { surah: 29, letters: "الم" }, { surah: 30, letters: "الم" },
            { surah: 31, letters: "الم" }, { surah: 32, letters: "الم" }, { surah: 36, letters: "يس" }, { surah: 38, letters: "ص" },
            { surah: 40, letters: "حم" }, { surah: 41, letters: "حم" }, { surah: 42, letters: "حم عسق" }, { surah: 43, letters: "حم" },
            { surah: 44, letters: "حم" }, { surah: 45, letters: "حم" }, { surah: 46, letters: "حم" }, { surah: 50, letters: "ق" },
            { surah: 68, letters: "ن" }
        ];

        return FULL_29_MUQATTAAT.map(({ surah, letters }) => ({
            surah,
            letters,
            isMentioned: surahNumbers.has(surah)
        }));
    }, [displayedResults]);

    const hasAnyMuqattaatInResults = allMuqattaatStats.some(item => item.isMentioned);

    const [isMuqattaatOpen, setIsMuqattaatOpen] = useState(() => {
        try { return localStorage.getItem("qran_muqattaat_open") === "true"; } catch { return false; }
    });

    
    const handleFormulaClick = (formula: string) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
        let nextFilters: string[];
        if (currentFilters.includes(formula)) {
            nextFilters = currentFilters.filter(f => f !== formula);
        } else {
            nextFilters = [...currentFilters, formula];
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    };

    const toggleMuqattaat = () => {
        const newState = !isMuqattaatOpen;
        setIsMuqattaatOpen(newState);
        try { localStorage.setItem("qran_muqattaat_open", String(newState)); } catch {}
    };

    return (
        <div className="mb-4 p-3 sm:p-4 bg-surface-subtle rounded-lg border border-border-default w-full max-w-full overflow-hidden">
            {correctedQuery && !isRootSearch && (
                <div className="mb-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 text-text-secondary rounded-r-lg">
                    <p>لم نجد نتائج لـ "{query}". نعرض لك نتائج لأقرب كلمة: <strong>{correctedQuery}</strong>.</p>
                    <button onClick={() => onNewSearch(query)} className="mt-2 text-sm font-bold hover:underline">
                        ابحث عن "{query}" بدلاً من ذلك
                    </button>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                    {searchType === 'text' ? (
                        <h3 className="text-lg font-semibold text-text-secondary flex items-center gap-2 flex-wrap">
                            <span>{isRootSearch ? 'نتائج البحث عن جذر الكلمة: ' : 'نتائج البحث عن الكلمات: '}</span>
                            <span className="font-bold text-primary-text-strong">{String(query).replace(/"/g, '')}</span>
                            {targetSurahNumber && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    في {QURAN_INDEX[targetSurahNumber - 1]?.name}
                                </span>
                            )}
                            {activeMuqattaatFilter && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {activeMuqattaatFilter}
                                </span>
                            )}
                        </h3>
                    ) : (
                        <h3 className="text-lg font-semibold text-text-secondary">الآيات التي تحمل الرقم "<span className="font-bold text-primary-text-strong">{query}</span>"</h3>
                    )}
                    
                    {resultsCount > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-text-primary shadow-sm cursor-help" title="إجمالي عدد الآيات التي تحتوي على كلمة البحث.">{displayedResultsCount} آيات</span>
                            {searchType === 'text' && (
                              <>
                                {isSingleWordSearch && !isRootSearch && (
                                  <>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-text-primary shadow-sm cursor-help" title="إجمالي عدد مرات ورود كلمة البحث في كل الآيات.">{generalOccurrences} تكراراً</span>
                                    
                                    <button
                                        onClick={() => {
                                            setExactMatch(!exactMatch);
                                        }}
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-purple-500
                                        ${exactMatch 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-purple-500/20 text-text-primary hover:bg-purple-500/40'}`}
                                        title="تفعيل/إلغاء تفعيل المطابقة التامة"
                                        aria-pressed={exactMatch}
                                    >
                                        {exactOccurrences} مطابقة
                                    </button>
                                  </>
                                )}
                                
                                <button
                                    onClick={() => {
                                        if (onToggleRootSearch) onToggleRootSearch(!isRootSearch);
                                    }}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-indigo-500
                                    ${isRootSearch 
                                        ? 'bg-indigo-600 text-white font-bold' 
                                        : 'bg-indigo-500/20 text-text-primary hover:bg-indigo-500/40'}`}
                                    title="البحث عن جميع الكلمات المرتبطة بنفس الجذر اللغوي"
                                    aria-pressed={isRootSearch}
                                >
                                    البحث بالجذر
                                </button>
                              </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {cachedAnalysisExists && shouldShowAnalysisButton && (
                <div className="mt-3 pt-3 border-t border-border-default">
                    <a href={`#/analysis/${encodeURIComponent(finalQueryForChecks)}`} onClick={(e) => { e.preventDefault(); window.location.hash = `#/analysis/${encodeURIComponent(finalQueryForChecks)}`; }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors">
                        <SparklesIcon className="w-5 h-5" />
                        <span>عرض التحليل المحفوظ لهذه الكلمة</span>
                    </a>
                </div>
            )}

            {allMuqattaatStats && allMuqattaatStats.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-default flex gap-2">
                    <button 
                        onClick={toggleMuqattaat}
                        className={`p-1.5 rounded self-start transition-colors flex items-center justify-center shrink-0 ${isMuqattaatOpen ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary'}`}
                        title="عرض/إخفاء"
                    >
                        <SparklesIcon className="w-4 h-4" />
                    </button>
                    {isMuqattaatOpen && (
                        <div className="grid grid-cols-4 gap-[1px] bg-border-default border border-border-default rounded shrink-0 self-start w-max">
                            {allMuqattaatStats.map((item, index) => (
                                <button 
                                    key={index}
                                    onClick={() => handleFormulaClick(item.letters)}
                                    className={`flex items-center justify-center px-1.5 py-1 text-[9px] leading-none font-amiri transition-all cursor-pointer ${
                                        item.isMentioned 
                                            ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20 font-bold' 
                                            : 'text-gray-400 bg-surface opacity-60 hover:opacity-100 hover:bg-surface-hover'
                                    } ${
                                        (activeMuqattaatFilter || '').split(',').map(f=>f.trim()).includes(item.letters)
                                            ? 'ring-1 ring-inset ring-green-500 bg-green-500/30 text-green-800 dark:text-green-200'
                                            : ''
                                    } ${index === 28 ? 'col-span-4' : ''}`}
                                    title={`تصفية سورة/سور ${item.letters}`}
                                >
                                    {item.letters}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchResultsHeader);