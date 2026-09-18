import React, { useState, useMemo, useEffect } from 'react';
import type { Ayah, SurahData } from '../types';
import { SearchIcon, ChevronLeftIcon } from './icons';
import MuqattaatBinaryMatrix from './search/MuqattaatBinaryMatrix';
import HawameemBinaryMatrix from './search/HawameemBinaryMatrix';
import { useSearch } from '../hooks/useSearch';
import { useSearchLogic } from '../hooks/useSearchLogic';
import SearchFiltersDrawer from './search/SearchFiltersDrawer';
import SearchForm from './SearchForm';
import SearchResultItem from './SearchResultItem';
import { useSettingsContext } from '../contexts/SettingsContext';
import { createRef } from 'react';

interface FingerprintToolViewProps {
    simpleCleanData: SurahData[];
    displayEditionData: SurahData[];
    allQuranData: { [key: string]: SurahData[] } | null;
    onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number, exactMatchOverride?: boolean) => void;
}

const FingerprintToolView: React.FC<FingerprintToolViewProps> = ({ simpleCleanData, displayEditionData, allQuranData, onNewSearch }) => {
    const { displayEdition, fontStyle, fontSize } = useSettingsContext();
    const imlaeiSimpleData = allQuranData?.['quran-simple'] || [];
    const [visibleCount, setVisibleCount] = useState(20);
    const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [query, setQuery] = useState('');
    
    const [isRootSearch, setIsRootSearch] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem('qran_recent_searches');
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) { }
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !(e.target as Element).closest('form')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectRecent = (text: string) => {
        setInputValue(text);
        setQuery(text);
        setShowDropdown(false);
        let newRecent = [text, ...recentSearches.filter(s => s !== text)];
        if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
    };

    const handleDeleteRecent = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(s => s !== text);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
            let newRecent = [trimmed, ...recentSearches.filter(s => s !== trimmed)];
            if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
            setRecentSearches(newRecent);
            try {
                localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
            } catch (err) {}
            setShowDropdown(false);
        }
    };

    const { performSearch } = useSearch(allQuranData);
    
    // 1. Get base results using useSearch
    const searchResult = useMemo(() => {
        if (!query) return { results: [] };
        return performSearch(query, isRootSearch);
    }, [query, isRootSearch, performSearch]);

    // 2. Apply advanced search logic to get exact matches, root matching, phrases, diacritics
    useEffect(() => { setVisibleCount(20); }, [query, isRootSearch]);

    const {
        exactMatch, setExactMatch,
        activePhraseFilter, setActivePhraseFilter,
        activeDiacriticFilter, setActiveDiacriticFilter,
        diacriticVariants,
        phraseFilters,
        displayedResults,
    } = useSearchLogic(
        query, ("correctedQuery" in searchResult ? searchResult.correctedQuery : undefined), searchResult.results, 'text', simpleCleanData, isRootSearch, displayEditionData, useMemo(() => ({ exact: true }), [])
    );

    const hasAnyMuqattaatInResults = useMemo(() => {
        if (!displayedResults || displayedResults.length === 0) return false;
        const targetSurahs = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);
        return displayedResults.some(a => a.surah && targetSurahs.has(a.surah.number));
    }, [displayedResults]);

    const hasAnyHawameemInResults = useMemo(() => {
        if (!displayedResults || displayedResults.length === 0) return false;
        const targetSurahs = new Set([40, 41, 42, 43, 44, 45, 46]);
        return displayedResults.some(a => a.surah && targetSurahs.has(a.surah.number));
    }, [displayedResults]);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl min-h-[70vh] flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <a href="#/structure" className="p-2 rounded-lg bg-surface border border-border-default hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 rtl:rotate-180" />
                </a>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">البصمة النورانية للمفردات</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        استخرج البصمة النورانية (29-bit) والمحولات العددية الخاصة بأي مفردة في القرآن الكريم
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                
                <div className="relative w-full">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="اكتب كلمة واحدة لاستخراج بصمتها النورانية..."
                            className="w-full pl-36 pr-12 py-4 bg-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-text-primary text-lg"
                            dir="rtl"
                        />
                        <button
                            type="submit"
                            className="absolute left-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            استخراج البصمة
                        </button>
                    </form>
                    {showDropdown && recentSearches.length > 0 && (
                        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-default rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                            <div className="px-4 py-2 text-sm font-semibold text-text-muted border-b border-border-subtle bg-surface-subtle sticky top-0">
                                عمليات البحث الأخيرة
                            </div>
                            <ul className="py-1">
                                {recentSearches.map((term, i) => (
                                    <li key={i} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectRecent(term)}
                                            className="w-full text-right px-4 py-3 text-base text-text-primary hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-3 cursor-pointer"
                                        >
                                            <SearchIcon className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                                            <span>{term}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteRecent(e, term)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                            title="حذف من السجل"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => {
                            if (!exactMatch) setIsRootSearch(false);
                            setExactMatch(!exactMatch);
                        }}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-purple-500
                        ${exactMatch 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-surface border border-border-default text-text-primary hover:bg-surface-hover hover:border-purple-500/50'}`}
                        aria-pressed={exactMatch}
                    >
                        المطابقة التامة
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => {
                            if (!isRootSearch) setExactMatch(false);
                            setIsRootSearch(!isRootSearch);
                        }}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-indigo-500
                        ${isRootSearch 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-surface border border-border-default text-text-primary hover:bg-surface-hover hover:border-indigo-500/50'}`}
                        aria-pressed={isRootSearch}
                    >
                        البحث بالجذر
                    </button>
                </div>
            </div>

            {query && (phraseFilters.length > 0 || diacriticVariants.length > 0) && (
                <div className="bg-surface rounded-xl border border-border-default overflow-hidden mt-4">
                    <SearchFiltersDrawer 
                        phraseFilters={phraseFilters}
                        activePhraseFilter={activePhraseFilter}
                        setActivePhraseFilter={setActivePhraseFilter}
                        diacriticVariants={diacriticVariants}
                        activeDiacriticFilter={activeDiacriticFilter}
                        setActiveDiacriticFilter={setActiveDiacriticFilter}
                        resultsCount={displayedResults.length}
                    />
                </div>
            )}

            {query && displayedResults.length === 0 && (
                <div className="p-8 text-center bg-surface border border-border-default rounded-xl text-text-secondary mt-4">
                    لم يتم العثور على نتائج للكلمة "{query}" في القرآن الكريم بالخيارات المحددة.
                </div>
            )}

            {query && displayedResults.length > 0 && (
                <div className="space-y-6 mt-4">
                    {hasAnyMuqattaatInResults ? (
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-primary">المصفوفة النورانية (29 سورة مقطعة)</h2>
                            <MuqattaatBinaryMatrix
                                query={query}
                                baseResults={searchResult.results}
                                displayedResults={displayedResults}
                                simpleCleanData={simpleCleanData}
                                onNewSearch={onNewSearch}
                            />
                        </div>
                    ) : (
                        <div className="p-4 text-center bg-surface border border-border-default rounded-xl text-text-secondary">
                            الكلمة "{query}" لم ترد في أي من السور الـ 29 المبدوءة بالحروف المقطعة. بصمتها النورانية هي أصفار.
                        </div>
                    )}


                    {hasAnyHawameemInResults && (
                        <div className="space-y-2 pt-6 border-t border-border-default">
                            <h2 className="text-lg font-bold text-amber-600">بصمة الحواميم (7 سور)</h2>
                            <HawameemBinaryMatrix
                                query={query}
                                baseResults={searchResult.results}
                                displayedResults={displayedResults}
                                simpleCleanData={simpleCleanData}
                                onNewSearch={onNewSearch}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {query && displayedResults.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h2 className="text-lg font-bold text-primary mb-4 border-b border-border-default pb-2">الآيات المطابقة ({displayedResults.length})</h2>
                    <ul className="space-y-4">
                        {displayedResults.slice(0, visibleCount).map((ayah, index) => {
                            const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah?.number);
                            const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
                            return (
                                <SearchResultItem 
                                    key={ayah.number} 
                                    itemRef={{ current: null }} 
                                    ayah={ayah}
                                    queryWords={[]} 
                                    currentQuery={query} 
                                    onNewSearch={onNewSearch}
                                    displayEdition={displayEdition} 
                                    displayEditionData={displayEditionData} 
                                    searchEdition="quran-simple-clean"
                                    imlaeiSimpleData={imlaeiSimpleData}
                                    fontSize={fontSize} 
                                    fontStyle={fontStyle} 
                                    searchType="text" 
                                    isCurrentlyPlaying={false}
                                    isPlaybackLoading={false}
                                    pulsingWordIndex={-1} 
                                    resultIndex={index}
                                    simpleAyahText={simpleAyah?.text || ''}
                                    copiedAyah={copiedAyah}
                                    onCopyAyah={(ayah) => {
                                        setCopiedAyah(ayah.number);
                                        setTimeout(() => setCopiedAyah(null), 2000);
                                    }}
                                />
                            );
                        })}
                    </ul>
                    {displayedResults.length > visibleCount && (
                        <div className="mt-8 py-6 px-4 bg-surface-subtle border border-border-default rounded-2xl text-center space-y-3 shadow-xs">
                            <div className="text-sm font-bold text-text-primary">
                                تم عرض <span className="text-primary font-mono">{visibleCount}</span> من إجمالي <span className="text-primary font-mono">{displayedResults.length}</span> آية
                            </div>
                            <button 
                                onClick={() => setVisibleCount(prev => prev + 20)}
                                className="px-6 py-2 bg-surface hover:bg-surface-hover border border-border-default rounded-full text-sm font-medium text-text-primary shadow-sm transition-all cursor-pointer"
                            >
                                عرض المزيد من الآيات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default FingerprintToolView;
