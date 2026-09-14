import React, { useState, useCallback } from 'react';
import type { Ayah } from '../../types';
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '../icons';
import { QURAN_INDEX } from '../../quranIndex';
import { safeLocalStorage } from '../../utils/storage';
import MuqattaatBinaryMatrix from './MuqattaatBinaryMatrix';
import HawameemBinaryMatrix from './HawameemBinaryMatrix';

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
    onNewSearch: (query: string) => void;
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

    const [isBinaryPanelOpen, setIsBinaryPanelOpen] = useState<boolean>(() => {
        return safeLocalStorage.getItem('qran_muqattaat_binary_panel_open') === 'true';
    });

    const [isHawameemPanelOpen, setIsHawameemPanelOpen] = useState<boolean>(() => {
        return safeLocalStorage.getItem('qran_hawameem_panel_open') === 'true';
    });

    const toggleBinaryPanel = useCallback(() => {
        setIsBinaryPanelOpen(prev => {
            const next = !prev;
            safeLocalStorage.setItem('qran_muqattaat_binary_panel_open', String(next));
            return next;
        });
    }, []);

    const toggleHawameemPanel = useCallback(() => {
        setIsHawameemPanelOpen(prev => {
            const next = !prev;
            safeLocalStorage.setItem('qran_hawameem_panel_open', String(next));
            return next;
        });
    }, []);

    const allMuqattaatStats = React.useMemo(() => {
        if (!displayedResults || displayedResults.length === 0) return [];
        const surahNumbers = Array.from(new Set(displayedResults.map(a => a.surah?.number).filter((n): n is number => !!n)));
        
        // Group surah names by their unique muqatta'at letters in CURRENT results
        const presentGroups: Record<string, string[]> = {};
        for (const num of surahNumbers) {
            const letters = SURAH_MUQATTAAT_MAP[num];
            if (letters) {
                const ayah = displayedResults.find(a => a.surah?.number === num);
                const surahName = ayah?.surah?.name || `سورة ${num}`;
                if (!presentGroups[letters]) {
                    presentGroups[letters] = [];
                }
                if (!presentGroups[letters].includes(surahName)) {
                    presentGroups[letters].push(surahName);
                }
            }
        }
        
        // Build the complete list of 14 items, ordered logically, marking each as mentioned or not
        return ALL_MUQATTAAT_CONFIG.map(({ letters, allSurahs }) => {
            const mentionedSurahs = presentGroups[letters] || [];
            const isMentioned = mentionedSurahs.length > 0;
            const allSurahNames = allSurahs.map(num => QURAN_INDEX[num - 1]?.name || `سورة ${num}`).join('، ');

            return {
                letters,
                isMentioned,
                count: mentionedSurahs.length,
                surahs: mentionedSurahs,
                tooltip: isMentioned 
                    ? `وردت في نتائج البحث (${mentionedSurahs.length} سور): ${mentionedSurahs.join('، ')}`
                    : `لم ترد في نتائج البحث (تبدأ بها في القرآن: ${allSurahNames})`
            };
        });
    }, [displayedResults]);

    // Check if at least one muqatta'at surah is involved or search results exist
    const hasAnyMuqattaatInResults = allMuqattaatStats.some(item => item.isMentioned);

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
                            <span className="font-bold text-primary-text-strong">{query.replace(/"/g, '')}</span>
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
                {showMuqattaatInSearch && allMuqattaatStats.length > 0 && hasAnyMuqattaatInResults && (
                    <div className="flex items-center justify-start sm:justify-end gap-2 flex-shrink-0 w-full sm:w-auto">
                        {/* 1. Al-Basma (29 Surahs) Button */}
                        <button
                            type="button"
                            onClick={toggleBinaryPanel}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs select-none ${
                                isBinaryPanelOpen 
                                    ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/30' 
                                    : 'bg-surface border-border-default hover:border-primary/60 hover:bg-surface-subtle text-text-secondary hover:text-text-primary'
                            }`}
                            title={isBinaryPanelOpen ? "إغلاق مصفوفة البصمة النورانية (29 سورة)" : "عرض مصفوفة البصمة النورانية (29 سورة) والمحولات العددية"}
                            aria-expanded={isBinaryPanelOpen}
                        >
                            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                                isBinaryPanelOpen ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                            }`}>
                                01
                            </span>
                            <span>البصمة</span>
                            <span className="text-[10px] opacity-75 font-mono">(29)</span>
                            {isBinaryPanelOpen ? (
                                <ChevronUpIcon className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronDownIcon className="w-3.5 h-3.5 text-text-muted" />
                            )}
                        </button>

                        {/* 2. Hawameem (7 Surahs) Button - distinctly styled */}
                        <button
                            type="button"
                            onClick={toggleHawameemPanel}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs select-none ${
                                isHawameemPanelOpen 
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/30' 
                                    : 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                            }`}
                            title={isHawameemPanelOpen ? "إغلاق بصمة الحواميم (7 سور)" : "عرض بصمة سور آل حم السبعة ومحولات أنظمة العد الخاصة بها"}
                            aria-expanded={isHawameemPanelOpen}
                        >
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isHawameemPanelOpen ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                                حم
                            </span>
                            <span>بصمة الحواميم</span>
                            <span className="text-[10px] opacity-75 font-mono">(7)</span>
                            {isHawameemPanelOpen ? (
                                <ChevronUpIcon className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronDownIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Collapsible 29-Surah Binary Matrix & Radix Converters Panel */}
            {showMuqattaatInSearch && isBinaryPanelOpen && hasAnyMuqattaatInResults && (
                <MuqattaatBinaryMatrix
                    query={finalQueryForChecks}
                    baseResults={baseResults}
                    displayedResults={displayedResults}
                    activeMuqattaatFilter={activeMuqattaatFilter}
                    setActiveMuqattaatFilter={setActiveMuqattaatFilter}
                    onClose={toggleBinaryPanel}
                    simpleCleanData={simpleCleanData}
                    onNewSearch={onNewSearch}
                />
            )}

            {/* Collapsible 7-Surah Hawameem Binary Matrix & Radix Converters Panel */}
            {showMuqattaatInSearch && isHawameemPanelOpen && hasAnyMuqattaatInResults && (
                <HawameemBinaryMatrix
                    query={finalQueryForChecks}
                    baseResults={baseResults}
                    displayedResults={displayedResults}
                    activeMuqattaatFilter={activeMuqattaatFilter}
                    setActiveMuqattaatFilter={setActiveMuqattaatFilter}
                    onClose={toggleHawameemPanel}
                    simpleCleanData={simpleCleanData}
                    onNewSearch={onNewSearch}
                />
            )}
            {cachedAnalysisExists && shouldShowAnalysisButton && (
                <div className="mt-3 pt-3 border-t border-border-default">
                    <a href={`#/analysis/${encodeURIComponent(finalQueryForChecks)}`} onClick={(e) => { e.preventDefault(); window.location.hash = `#/analysis/${encodeURIComponent(finalQueryForChecks)}`; }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors">
                        <SparklesIcon className="w-5 h-5" />
                        <span>عرض التحليل المحفوظ لهذه الكلمة</span>
                    </a>
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchResultsHeader);