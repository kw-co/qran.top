import React, { useState } from 'react';
import type { Ayah } from '../../types';
import { SparklesIcon } from '../icons';
import { QURAN_INDEX } from '../../quranIndex';
import { normalizeArabicText } from '../../utils/text';

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

// Complete list of all 29 Muqatta'at Surahs with Arabic names and letters in Quranic order
export const FULL_29_MUQATTAAT_LIST = [
    { surah: 2,  name: "البقرة",    letters: "الم" },
    { surah: 3,  name: "آل عمران",  letters: "الم" },
    { surah: 7,  name: "الأعراف",   letters: "المص" },
    { surah: 10, name: "يونس",      letters: "الر" },
    { surah: 11, name: "هود",       letters: "الر" },
    { surah: 12, name: "يوسف",      letters: "الر" },
    { surah: 13, name: "الرعد",     letters: "المر" },
    { surah: 14, name: "إبراهيم",   letters: "الر" },
    { surah: 15, name: "الحجر",     letters: "الر" },
    { surah: 19, name: "مريم",      letters: "كهيعص" },
    { surah: 20, name: "طه",        letters: "طه" },
    { surah: 26, name: "الشعراء",   letters: "طسم" },
    { surah: 27, name: "النمل",     letters: "طس" },
    { surah: 28, name: "القصص",     letters: "طسم" },
    { surah: 29, name: "العنكبوت",  letters: "الم" },
    { surah: 30, name: "الروم",     letters: "الم" },
    { surah: 31, name: "لقمان",     letters: "الم" },
    { surah: 32, name: "السجدة",    letters: "الم" },
    { surah: 36, name: "يس",        letters: "يس" },
    { surah: 38, name: "ص",         letters: "ص" },
    { surah: 40, name: "غافر",      letters: "حم" },
    { surah: 41, name: "فصلت",      letters: "حم" },
    { surah: 42, name: "الشورى",    letters: "حم عسق" },
    { surah: 43, name: "الزخرف",    letters: "حم" },
    { surah: 44, name: "الدخان",    letters: "حم" },
    { surah: 45, name: "الجاثية",   letters: "حم" },
    { surah: 46, name: "الأحقاف",   letters: "حم" },
    { surah: 50, name: "ق",         letters: "ق" },
    { surah: 68, name: "القلم",     letters: "ن" }
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
    activePhraseFilter?: string;
    activeDiacriticFilter?: string;
    displayEditionData?: any[];
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
    searchType, query, correctedQuery, targetSurahNumber, activeMuqattaatFilter = '', setActiveMuqattaatFilter, baseResults = [], displayedResultsCount, resultsCount,
    isSingleWordSearch, generalOccurrences, exactOccurrences, exactMatch,
    setExactMatch, totalOccurrences, onJumpToOccurrence, 
    cachedAnalysisExists, onNewSearch, isRootSearch = false, onToggleRootSearch,
    displayedResults = [], showMuqattaatInSearch = true, simpleCleanData,
    activePhraseFilter, activeDiacriticFilter, displayEditionData
}) => {
    const finalQueryForChecks = correctedQuery || query;
    const shouldShowAnalysisButton = finalQueryForChecks.trim().split(/\s+/).filter(Boolean).length === 1 && searchType === 'text';

    const activeFiltersList = React.useMemo(() => {
        return (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
    }, [activeMuqattaatFilter]);

    const allMuqattaatStats = React.useMemo(() => {
        const sourceResults = (baseResults !== undefined) ? baseResults : displayedResults;
        if (!sourceResults && !displayedResults) return [];
        if ((!sourceResults || sourceResults.length === 0) && resultsCount === 0 && displayedResults.length === 0) return [];

        const currentFilteredNumbers = new Set(displayedResults.map(a => a.surah?.number).filter((n): n is number => !!n));

        const transformedQuery = normalizeArabicText(String(finalQueryForChecks || '')).replace(/"/g, '').trim();
        const searchWords = transformedQuery ? transformedQuery.split(/\s+/).filter(Boolean) : [];

        const hasDiacriticFilter = Boolean(activeDiacriticFilter && activeDiacriticFilter.trim() !== '');
        const dFilters = hasDiacriticFilter ? activeDiacriticFilter!.split(',').map(f => f.trim()).filter(Boolean) : [];

        const hasPhraseFilter = Boolean(activePhraseFilter && activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '');
        const pFilters = hasPhraseFilter ? activePhraseFilter!.split(',').map(f => f.trim()).filter(Boolean) : [];

        return FULL_29_MUQATTAAT_LIST.map(({ surah, name, letters }) => {
            const surahAyahs = (sourceResults || []).filter(a => a.surah?.number === surah);
            const ayahsCount = surahAyahs.length;

            let occurrences = 0;
            if (ayahsCount > 0) {
                if (hasDiacriticFilter && dFilters.length > 0) {
                    for (const ayah of surahAyahs) {
                        const displaySurah = displayEditionData?.find((s: any) => s.number === ayah.surah?.number);
                        const displayAyah = displaySurah?.ayahs.find((a: any) => a.numberInSurah === ayah.numberInSurah);
                        const targetText = String(displayAyah?.text || ayah.text || '');
                        const cleanAyahText = targetText.replace(/[\u06D6-\u06ED]/g, '').replace(/\s+/g, ' ');
                        const words = cleanAyahText.split(/\s+/).filter(Boolean);
                        
                        let matchedInAyah = 0;
                        for (const df of dFilters) {
                            for (const w of words) {
                                if (w === df || (!exactMatch && w.includes(df))) {
                                    matchedInAyah++;
                                }
                            }
                        }
                        occurrences += (matchedInAyah > 0 ? matchedInAyah : 1);
                    }
                } else if (hasPhraseFilter && pFilters.length > 0) {
                    for (const ayah of surahAyahs) {
                        const ayahNorm = normalizeArabicText(ayah.text || '');
                        let matchedInAyah = 0;
                        for (const pf of pFilters) {
                            const normPf = normalizeArabicText(pf);
                            let idx = ayahNorm.indexOf(normPf);
                            while (idx !== -1) {
                                matchedInAyah++;
                                idx = ayahNorm.indexOf(normPf, idx + Math.max(1, normPf.length));
                            }
                        }
                        occurrences += (matchedInAyah > 0 ? matchedInAyah : 1);
                    }
                } else if (searchWords.length > 0) {
                    for (const ayah of surahAyahs) {
                        if (!ayah.text) {
                            occurrences++;
                            continue;
                        }
                        const ayahNorm = normalizeArabicText(ayah.text);
                        const words = ayahNorm.split(/\s+/).filter(Boolean);

                        if (exactMatch) {
                            for (let i = 0; i <= words.length - searchWords.length; i++) {
                                const slice = words.slice(i, i + searchWords.length);
                                if (slice.join(' ') === searchWords.join(' ')) {
                                    occurrences++;
                                }
                            }
                        } else if (searchWords.length === 1) {
                            const target = searchWords[0];
                            for (const w of words) {
                                if (w.includes(target)) {
                                    occurrences++;
                                }
                            }
                        } else {
                            for (let i = 0; i <= words.length - searchWords.length; i++) {
                                const slice = words.slice(i, i + searchWords.length);
                                if (slice.join(' ') === searchWords.join(' ')) {
                                    occurrences++;
                                }
                            }
                        }
                    }
                }
            }

            const count = occurrences > 0 ? occurrences : ayahsCount;
            const isMentioned = count > 0;
            const isDisplayed = currentFilteredNumbers.has(surah);
            const isSurahFiltered = activeFiltersList.includes(`s:${surah}`);
            const isFormulaFiltered = activeFiltersList.includes(letters);
            const isFilterActive = isSurahFiltered || isFormulaFiltered;

            return {
                surah,
                name,
                letters,
                count,
                ayahsCount,
                isMentioned,
                isDisplayed,
                isFilterActive,
                isSurahFiltered,
                isFormulaFiltered
            };
        });
    }, [
        baseResults, 
        displayedResults, 
        activeFiltersList, 
        finalQueryForChecks, 
        exactMatch, 
        activePhraseFilter, 
        activeDiacriticFilter, 
        displayEditionData, 
        resultsCount
    ]);

    const hasAnyMuqattaatInResults = allMuqattaatStats.some(item => item.isMentioned);

    const [isMuqattaatOpen, setIsMuqattaatOpen] = useState(() => {
        try { return localStorage.getItem("qran_muqattaat_open") === "true"; } catch { return false; }
    });

    const [hoveredSurah, setHoveredSurah] = useState<(typeof allMuqattaatStats)[0] | null>(null);

    const handleSurahClick = (item: (typeof allMuqattaatStats)[0]) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
        const surahKey = `s:${item.surah}`;
        
        let nextFilters: string[];
        if (currentFilters.includes(surahKey)) {
            // Already filtered by this surah, toggle off
            nextFilters = currentFilters.filter(f => f !== surahKey);
        } else if (currentFilters.includes(item.letters)) {
            // If the whole formula was active, switch to this specific surah
            nextFilters = currentFilters.filter(f => f !== item.letters);
            nextFilters.push(surahKey);
        } else {
            // Filter by this surah
            nextFilters = [...currentFilters, surahKey];
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    };

    const handleFormulaClick = (formula: string) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
        let nextFilters: string[];
        if (currentFilters.includes(formula)) {
            nextFilters = currentFilters.filter(f => f !== formula);
        } else {
            // Remove any specific surahs of this formula and add the formula
            const formulaSurahKeys = FULL_29_MUQATTAAT_LIST.filter(s => s.letters === formula).map(s => `s:${s.surah}`);
            nextFilters = currentFilters.filter(f => !formulaSurahKeys.includes(f));
            nextFilters.push(formula);
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    };

    const toggleMuqattaat = () => {
        const newState = !isMuqattaatOpen;
        setIsMuqattaatOpen(newState);
        try { localStorage.setItem("qran_muqattaat_open", String(newState)); } catch {}
    };

    const formatFilterLabel = (rawFilter: string) => {
        const parts = rawFilter.split(',').map(f => f.trim()).filter(Boolean);
        if (parts.length === 0) return '';
        return parts.map(part => {
            if (part.startsWith('s:')) {
                const sNum = parseInt(part.replace('s:', ''), 10);
                const sItem = FULL_29_MUQATTAAT_LIST.find(s => s.surah === sNum);
                return sItem ? `سورة ${sItem.name}` : `سورة (${sNum})`;
            }
            return `فواتح [${part}]`;
        }).join(' + ');
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    <span>{formatFilterLabel(activeMuqattaatFilter)}</span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveMuqattaatFilter?.('')}
                                        className="hover:text-red-500 text-text-muted hover:bg-surface rounded px-1 transition-colors"
                                        title="إلغاء التصفية"
                                    >
                                        ✕
                                    </button>
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

                                  {isSingleWordSearch && (
                                    <a
                                        href={`#/word-geometry/${encodeURIComponent(finalQueryForChecks)}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-text-primary hover:bg-emerald-500/30 transition-all shadow-sm border border-emerald-500/30"
                                        title="دراسة قوة الكلمة ومركز ثقلها المصحفي وهندسة أرقام السور الحاضنة"
                                    >
                                        <span>⚖️ هندسة السور ومركز الثقل</span>
                                    </a>
                                  )}
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
                <div className="mt-3 pt-3 border-t border-border-default space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleMuqattaat}
                                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                                    isMuqattaatOpen 
                                        ? 'bg-primary text-white shadow-2xs' 
                                        : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-default'
                                }`}
                                title="عرض جدول السور ذات الفواتح النورانية الـ 29"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span>جدول السور النورانية (29 سورة)</span>
                            </button>
                            <span className="text-[11px] text-text-muted hidden sm:inline">
                                تبيان ورود كلمة البحث في السور المفتتحة بالحروف المقطعة
                            </span>
                        </div>

                        {activeMuqattaatFilter && (
                            <button
                                type="button"
                                onClick={() => setActiveMuqattaatFilter?.('')}
                                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:underline font-bold"
                            >
                                إلغاء تصفية السور ✕
                            </button>
                        )}
                    </div>

                    {isMuqattaatOpen && (
                        <div className="p-3 bg-surface rounded-xl border border-border-default shadow-xs space-y-2.5 animate-in fade-in duration-200">
                            {/* Live Hover Info Banner - Displays instantly on mouse move */}
                            <div className="p-2 sm:p-2.5 rounded-lg bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs min-h-[42px]">
                                {hoveredSurah ? (
                                    <>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-text-primary text-[13px]">
                                                سورة {hoveredSurah.name}
                                            </span>
                                            <span className="text-[11px] text-text-muted font-mono bg-surface px-1.5 py-0.5 rounded border border-border-default/60">
                                                رقم السورة: {hoveredSurah.surah}
                                            </span>
                                            <span className="font-amiri text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                                فاتحتها: [{hoveredSurah.letters}]
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {hoveredSurah.isMentioned ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                    <span>✓</span>
                                                    <span>
                                                        تكرار الورود: {hoveredSurah.count}
                                                        {hoveredSurah.ayahsCount && hoveredSurah.ayahsCount !== hoveredSurah.count 
                                                            ? ` (في ${hoveredSurah.ayahsCount} آيات)` 
                                                            : ''}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded">
                                                    <span>✗</span>
                                                    <span>لم ترد في هذه السورة (0)</span>
                                                </span>
                                            )}

                                            {hoveredSurah.isMentioned && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSurahClick(hoveredSurah)}
                                                    className="text-[11px] font-bold text-primary hover:underline px-1 cursor-pointer"
                                                >
                                                    {hoveredSurah.isFilterActive ? 'إلغاء التصفية' : `تصفية سورة ${hoveredSurah.name}`}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleFormulaClick(hoveredSurah.letters)}
                                                className="text-[11px] text-text-secondary hover:text-text-primary hover:underline px-1 cursor-pointer"
                                                title={`تصفية كافة السور المفتتحة بـ [${hoveredSurah.letters}]`}
                                            >
                                                تصفية كل سور [{hoveredSurah.letters}]
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full flex items-center justify-between text-[11px] text-text-muted">
                                        <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span>أخضر: السور التي وردت فيها الكلمة</span>
                                            <span className="mx-1">•</span>
                                            <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                                            <span>رمادي: لم ترد في نتائج البحث</span>
                                        </span>
                                        <span className="font-medium text-text-secondary">
                                            مرر الفأرة فوق أي سورة لمعرفة اسمها فوراً وحالة ورودها
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 29 Surahs Grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-14 gap-1.5">
                                {allMuqattaatStats.map((item, index) => {
                                    const tooltipText = [
                                        `سورة ${item.name} [فاتحة: ${item.letters}] (رقم السورة: ${item.surah})`,
                                        item.isMentioned 
                                            ? `✓ تكرار الورود: ${item.count}${item.ayahsCount && item.ayahsCount !== item.count ? ` (في ${item.ayahsCount} آيات)` : ''}` 
                                            : `✗ لم ترد في سورة ${item.name} (0)`,
                                        item.isMentioned 
                                            ? (item.isFilterActive ? 'انقر لإلغاء التصفية' : `انقر لتصفية النتائج على سورة ${item.name}`)
                                            : `غير مذكورة في نتائج البحث`
                                    ].join('\n');

                                    return (
                                        <button 
                                            key={index}
                                            onClick={() => handleSurahClick(item)}
                                            onMouseEnter={() => setHoveredSurah(item)}
                                            onMouseLeave={() => setHoveredSurah(null)}
                                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center select-none cursor-pointer ${
                                                item.isFilterActive
                                                    ? 'border-primary ring-2 ring-primary/40 bg-primary/20 text-primary font-bold shadow-xs'
                                                    : item.isMentioned 
                                                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/60 font-bold' 
                                                    : 'text-text-muted bg-surface-subtle/50 opacity-60 hover:opacity-100 hover:bg-surface-subtle border-border-default/50 hover:border-border-default'
                                            }`}
                                            title={tooltipText}
                                        >
                                            <span className="text-xs font-bold leading-none font-amiri tracking-wide">
                                                {item.letters}
                                            </span>
                                            <span className="text-[9px] font-sans leading-tight mt-1 truncate max-w-full text-text-secondary">
                                                {item.name}
                                            </span>
                                            <span 
                                                className={`text-[9.5px] font-mono font-bold leading-tight mt-0.5 truncate max-w-full px-0.5 ${
                                                    item.isMentioned 
                                                        ? 'text-emerald-700 dark:text-emerald-300' 
                                                        : 'text-text-muted/60'
                                                }`}
                                                title={`تكرار الورود: ${item.count} (رقم السورة: ${item.surah})`}
                                            >
                                                {item.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(SearchResultsHeader);
