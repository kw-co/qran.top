import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, ClearIcon, DocumentDuplicateIcon } from './icons';
import { normalizeArabicText, formatSurahNameForDisplay, formatAyahForCopy, copyToClipboard, normalizeDigits } from '../utils/text';
import { useSearchLogic } from '../hooks/useSearchLogic';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';

import AyahActionPopover from './AyahActionPopover';
import SearchResultItem from './SearchResultItem';
import SearchResultsHeader from './search/SearchResultsHeader';
import SearchResultsToolbar from './search/SearchResultsToolbar';
import SearchFiltersDrawer from './search/SearchFiltersDrawer';
import NeighboringWords from './search/NeighboringWords';
import DhikrModal from './DhikrModal';


interface SearchViewProps {
  query: string;
  results: Ayah[];
  onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number, exactMatchOverride?: boolean) => void;
  onSearchByAyahNumber: (ayahNumber: number) => void;
  onSearchComplete: () => void;
  autoOpenDiscussion?: boolean;
  displayEditionData: SurahData[];
  searchEdition: string;
  position?: { surah: number, ayah: number, wordIndex: number };
  simpleCleanData: SurahData[];
  imlaeiSimpleData?: SurahData[];
  onSaveAyah: (item: SavedAyahItem) => void;
  onSaveSearch: (item: SavedSearchItem) => void;
  searchType?: 'text' | 'number';
  // --- Props for audio playback ---
  currentlyPlayingAyahGlobalNumber: number | null;
  isPlaybackLoading: boolean;
  onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number, options?: any) => void;
  correctedQuery?: string;
  isRootSearch?: boolean;
  targetSurahNumber?: number;
  queryParams?: URLSearchParams;
  initialFilters?: { exact?: boolean; phrase?: string; diacritic?: string; };
  isDigitSum?: boolean;
  onToggleDigitSum?: (active: boolean) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ 
    query, results, onNewSearch, onSearchByAyahNumber, onSearchComplete, autoOpenDiscussion, 
    displayEditionData, searchEdition, position, 
    simpleCleanData, imlaeiSimpleData, onSaveAyah, onSaveSearch, searchType = 'text',
    currentlyPlayingAyahGlobalNumber, isPlaybackLoading, onStartPlayback,
    correctedQuery, isRootSearch = false, targetSurahNumber, queryParams,
    isDigitSum, onToggleDigitSum
}) => {
  const targetNumberVal = useMemo(() => {
    if (searchType !== 'number') return undefined;
    const n = parseInt(normalizeDigits(query), 10);
    return isNaN(n) ? undefined : n;
  }, [searchType, query]);
  const [isEditableQuery, setIsEditableQuery] = useState(false);
  const [editableQuery, setEditableQuery] = useState(query);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isHighlightedCopied, setIsHighlightedCopied] = useState(false);
  const [copyHighlightedMode, setCopyHighlightedMode] = useState<number>(0);
  const [copyHighlightedToast, setCopyHighlightedToast] = useState<string>('');
  
  // Dhikr State
  const [isDhikrModalOpen, setIsDhikrModalOpen] = useState(false);
  const [dhikrRepeatAyah, setDhikrRepeatAyah] = useState<number>(3);
  const [dhikrRepeatPlaylist, setDhikrRepeatPlaylist] = useState<number>(1);
  const [dhikrDelay, setDhikrDelay] = useState<number>(0);
  
  // Consume Settings from Context
  const { displayEdition, fontStyle, selectedAudioEdition, setSelectedAudioEdition, activeEditions, fontSize, copyTextFormat, copyCitationFormat, showMuqattaatInSearch } = useSettingsContext();

  const itemRefs = useRef<React.RefObject<HTMLLIElement>[]>([]);
  
  const [wordPopoverState, setWordPopoverState] = useState<{
    resultIndex: number;
    simpleText: string;
    triggerElement: HTMLElement;
  } | null>(null);
  const wordPopoverRef = useRef<HTMLDivElement>(null);

  const [activePopover, setActivePopover] = useState<{ ayah: Ayah; triggerElement: HTMLElement } | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [cachedAnalysisExists, setCachedAnalysisExists] = useState(false);
  const [pulsingWord, setPulsingWord] = useState<{ itemIndex: number; wordIndex: number } | null>(null);

  // Parse initial filters from URL or props
  const initialFilters = useMemo(() => {
    try {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      const params = qIndex !== -1 ? new URLSearchParams(hash.substring(qIndex + 1)) : queryParams;
      if (!params) return {};
      return {
        phrase: params.get('phrase') || params.get('p') || undefined,
        diacritic: params.get('diacritic') || params.get('d') || undefined,
        exact: (params.get('exact') === '1' || params.get('exact') === 'true') ? true : undefined,
        sort: (params.get('sort') === 'freq' ? 'freq' : 'alpha') as 'alpha' | 'freq',
        tab: (params.get('tab') === 'phrases' ? 'phrases' : 'diacritics') as 'phrases' | 'diacritics',
      };
    } catch {
      return {};
    }
  }, [queryParams]);

  const [filterSortOrder, setFilterSortOrder] = useState<'alpha' | 'freq'>(initialFilters.sort || 'alpha');
  const [filterActiveTab, setFilterActiveTab] = useState<'phrases' | 'diacritics'>(initialFilters.tab || 'diacritics');
  const [isShareCopied, setIsShareCopied] = useState(false);

  // Pagination / Batching for super-fast DOM rendering on frequent queries (like "الله")
  const INITIAL_BATCH_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const effectiveEditionData = useMemo(() => {
    return (imlaeiSimpleData && imlaeiSimpleData.length > 0) ? imlaeiSimpleData : displayEditionData;
  }, [imlaeiSimpleData, displayEditionData]);

  const {
    exactMatch, setExactMatch,
    visibleSuggestionsCount, handleShowMore,
    activePhraseFilter, setActivePhraseFilter, activeMuqattaatFilter, setActiveMuqattaatFilter, activeDiacriticFilter, setActiveDiacriticFilter, diacriticVariants,
    queryWords, isSingleWordSearch,
    phraseFilters,
    displayedResults,
    muqattaatSourceResults,
    occurrencesMap, totalOccurrences,
    generalOccurrences, exactOccurrences,
    neighboringWords,
    formatResultsForExport,
  } = useSearchLogic(
    query, correctedQuery, results, searchType as 'text' | 'number', simpleCleanData, isRootSearch, effectiveEditionData,
    {
      phrase: initialFilters.phrase,
      diacritic: initialFilters.diacritic,
      exact: initialFilters.exact,
    }
  );

  // Sync URL hash with search query, filters and settings so sharing the link reproduces the exact state
  useEffect(() => {
    if (searchType === 'number') return;
    try {
      const currentHash = window.location.hash || '';
      if (!currentHash.startsWith('#/search')) return;

      const pathPart = currentHash.split('?')[0];
      const params = new URLSearchParams();

      if (isRootSearch) params.set('mode', 'root');
      if (targetSurahNumber) params.set('ts', targetSurahNumber.toString());
      if (position) {
        params.set('s', position.surah.toString());
        params.set('a', position.ayah.toString());
        params.set('w', position.wordIndex.toString());
      }
      if (exactMatch) params.set('exact', '1');
      if (activePhraseFilter && activePhraseFilter !== 'all') {
        params.set('phrase', activePhraseFilter);
      }
      if (activeDiacriticFilter && activeDiacriticFilter.trim() !== '') {
        params.set('diacritic', activeDiacriticFilter);
      }
      if (filterSortOrder && filterSortOrder !== 'alpha') {
        params.set('sort', filterSortOrder);
      }
      if (filterActiveTab && filterActiveTab !== 'phrases') {
        params.set('tab', filterActiveTab);
      }

      const queryString = params.toString();
      const newHash = queryString ? `${pathPart}?${queryString}` : pathPart;

      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    } catch {
      // ignore
    }
  }, [
    searchType, isRootSearch, targetSurahNumber, position,
    exactMatch, activePhraseFilter, activeDiacriticFilter,
    filterSortOrder, filterActiveTab
  ]);

  const handleShareSearch = useCallback(() => {
    const fullUrl = window.location.href;
    copyToClipboard(fullUrl);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2500);
  }, []);

  // Live In-Results Filtering (allows filtering current results on the fly without losing context)
  const [inResultsFilter, setInResultsFilter] = useState<string>('');

  // Listen to live search input from the top search bar
  useEffect(() => {
    const handleLiveSearch = (e: any) => {
      const raw = typeof e?.detail?.query === 'string' ? e.detail.query.trim() : '';
      if (raw && normalizeArabicText(raw) !== normalizeArabicText(query)) {
        setInResultsFilter(raw);
      } else {
        setInResultsFilter('');
      }
    };
    window.addEventListener('quran-live-search', handleLiveSearch);
    return () => window.removeEventListener('quran-live-search', handleLiveSearch);
  }, [query]);

  // Reset in-results filter when base query changes
  useEffect(() => {
    setInResultsFilter('');
  }, [query]);

  // Reset pagination whenever query, filters or sorting change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [query, correctedQuery, activePhraseFilter, exactMatch, searchType, isRootSearch, inResultsFilter]);

  // Filter current displayedResults by inResultsFilter
  const filteredResults = useMemo(() => {
    const trimmed = inResultsFilter.trim();
    if (!trimmed) return displayedResults;

    const normFilter = normalizeArabicText(trimmed);
    if (!normFilter) return displayedResults;

    const filterTokens = normFilter.split(/\s+/).filter(Boolean);
    if (filterTokens.length === 0) return displayedResults;

    return displayedResults.filter(ayah => {
      const uthmaniNorm = normalizeArabicText(ayah.text || '');
      const simpleSurah = simpleCleanData?.find(s => s.number === ayah.surah?.number);
      const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
      const simpleNorm = normalizeArabicText(simpleAyah?.text || '');

      return filterTokens.every(token => (uthmaniNorm.length > 0 && uthmaniNorm.includes(token)) || (simpleNorm.length > 0 && simpleNorm.includes(token)));
    });
  }, [displayedResults, inResultsFilter, simpleCleanData]);

  const paginatedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (visibleCount >= filteredResults.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestAnimationFrame(() => {
            setVisibleCount(prev => Math.min(prev + 40, filteredResults.length));
          });
        }
      },
      { rootMargin: '300px' }
    );

    const currentSentinel = loadMoreSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [visibleCount, filteredResults.length]);

  const normalizedQueryForDiscussion = useMemo(() => {
    if (searchType === 'number') return `topic:ayah-number:${query}`;
    return normalizeArabicText(correctedQuery || query);
  }, [query, correctedQuery, searchType]);

  useEffect(() => { setEditableQuery(query); }, [query]);
  useEffect(() => { onSearchComplete(); }, [results, onSearchComplete]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (wordPopoverRef.current && !wordPopoverRef.current.contains(event.target as Node)) {
            if (!(event.target as HTMLElement).closest('.word-trigger')) {
                setWordPopoverState(null);
            }
        }
        if (!(event.target as HTMLElement).closest('.popover-trigger, .popover-content')) {
            setActivePopover(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCachedAnalysisExists(false);
  }, [query, correctedQuery, searchType]);

  itemRefs.current = displayedResults.map((_, i) => itemRefs.current[i] ?? React.createRef());

  useEffect(() => {
    if (currentlyPlayingAyahGlobalNumber) {
        const playingIndex = displayedResults.findIndex(ayah => ayah.number === currentlyPlayingAyahGlobalNumber);
        if (playingIndex !== -1) {
            if (playingIndex >= visibleCount) {
                setVisibleCount(playingIndex + 20);
            }
            setTimeout(() => {
                if (itemRefs.current[playingIndex]?.current) {
                    itemRefs.current[playingIndex].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }
  }, [currentlyPlayingAyahGlobalNumber, displayedResults, visibleCount]);

  const handleJumpToOccurrence = (target: number) => {
    const occurrence = occurrencesMap[target - 1];
    if (occurrence) {
        if (occurrence.itemIndex >= visibleCount) {
            setVisibleCount(occurrence.itemIndex + 20);
        }
        setTimeout(() => {
            if (itemRefs.current[occurrence.itemIndex]?.current) {
                const element = itemRefs.current[occurrence.itemIndex].current;
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setPulsingWord({ itemIndex: occurrence.itemIndex, wordIndex: occurrence.wordIndex });
                setTimeout(() => setPulsingWord(null), 3000);
            }
        }, 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = editableQuery.trim();
    if (trimmedQuery && trimmedQuery !== query) onNewSearch(trimmedQuery, undefined, undefined, isRootSearch);
  };

  const handleSaveSearch = () => {
    const queryToSave = correctedQuery || query;
    if (queryToSave) onSaveSearch({ type: 'search', id: queryToSave, query: queryToSave, createdAt: Date.now() });
  };
  
  

  const deferredResults = useDeferredValue(results);

  

  

  const handleCopyAll = () => {
    const textToCopy = formatResultsForExport(displayEditionData);
    if (textToCopy) navigator.clipboard.writeText(textToCopy).then(() => {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2500);
    });
  };

    const handleCopyHighlightedWords = () => {
    if (phraseFilters.length === 0) return;
    let textToCopy = '';
    let toastMsg = '';
    let nextMode = 0;

    if (copyHighlightedMode === 0) {
        textToCopy = phraseFilters.map(w => w.phrase).join('، ');
        toastMsg = 'تم النسخ: الكلمات فقط';
        nextMode = 1;
    } else {
        textToCopy = phraseFilters.map(w => {
            const timesStr = w.count === 1 ? 'مرة' : w.count === 2 ? 'مرتان' : w.count <= 10 ? 'مرات' : 'مرة';
            return `${w.phrase} (${w.count} ${timesStr})`;
        }).join('، ');
        toastMsg = 'تم النسخ: الكلمات + عدد التكرار';
        nextMode = 0;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy);
    }
    
    setCopyHighlightedMode(nextMode);
    setCopyHighlightedToast(toastMsg);
    setIsHighlightedCopied(true);
    setTimeout(() => {
        setIsHighlightedCopied(false);
    }, 2500);
  };

  const handleDownloadAll = () => {
    const textToDownload = formatResultsForExport(displayEditionData);
    if (textToDownload) {
        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const safeQuery = String(correctedQuery || query || '').replace(/[^a-zA-Z0-9-ء-ي ]/g, "").trim() || 'results';
        link.download = `qran-top-search-${safeQuery}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
  };
  
  const handlePlayAll = () => {
    if (displayedResults.length > 0) {
      onStartPlayback(displayedResults, selectedAudioEdition, 0, {
        isExplicitPlaylist: true,
        repeatAyahTarget: 1,
        repeatPlaylistTarget: 1,
      });
    }
  };

  const handlePlayAllAsDhikr = () => {
    setIsDhikrModalOpen(true);
  };

  const handleStartDhikrPlayback = () => {
    if (displayedResults.length > 0) {
      onStartPlayback(displayedResults, selectedAudioEdition, 0, {
        isExplicitPlaylist: true,
        repeatAyahTarget: dhikrRepeatAyah,
        repeatPlaylistTarget: dhikrRepeatPlaylist,
        delaySeconds: dhikrDelay,
      });
    }
  };

  const handlePlaySingleAyah = useCallback((index: number) => {
    if (displayedResults.length > 0) {
      onStartPlayback(displayedResults, selectedAudioEdition, index, {
        isExplicitPlaylist: true,
      });
    }
  }, [displayedResults, onStartPlayback, selectedAudioEdition]);

  // --- Ayah Action Handlers ---
  const handleUthmaniWordClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, resultIndex: number, simpleAyahText: string) => {
    setWordPopoverState(prev => prev?.resultIndex === resultIndex ? null : { resultIndex, simpleText: simpleAyahText, triggerElement: e.currentTarget });
  }, []);

  const handleSaveClick = useCallback((ayah: Ayah) => {
    onSaveAyah({ type: 'ayah', id: `${ayah.surah!.number}:${ayah.numberInSurah}`, surah: ayah.surah!.number, ayah: ayah.numberInSurah, text: ayah.text || '', createdAt: Date.now() });
    setActivePopover(null);
  }, [onSaveAyah]);

  const handleCopyAyah = useCallback((ayah: Ayah) => {
    let ayahText = ayah.text || '';
    const sNum = ayah.surah?.number;
    const aNum = ayah.numberInSurah;

    if (!ayahText && simpleCleanData && sNum) {
        const foundSurah = simpleCleanData.find(s => s.number === sNum);
        const foundAyah = foundSurah?.ayahs.find(a => a.numberInSurah === aNum);
        if (foundAyah?.text) {
            ayahText = foundAyah.text;
        }
    }

    const surahName = ayah.surah?.name;
    const textToCopy = formatAyahForCopy({
        ayahText,
        surahName,
        surahNumber: sNum,
        ayahNumber: aNum,
        textFormat: copyTextFormat,
        citationFormat: copyCitationFormat,
        fontStyle
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedAyah(ayah.number || aNum);
        setTimeout(() => setCopiedAyah(null), 2000);
        setActivePopover(null);
    });
  }, [copyTextFormat, copyCitationFormat, fontStyle, simpleCleanData]);
  const handleSearchByAyahText = (ayah: Ayah) => {
    const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah!.number);
    const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
    if (simpleAyah?.text) onNewSearch(simpleAyah.text, 'quran-simple-clean', { surah: ayah.surah!.number, ayah: ayah.numberInSurah, wordIndex: 0 });
    else if (ayah.text) onNewSearch(ayah.text, displayEdition.identifier, { surah: ayah.surah!.number, ayah: ayah.numberInSurah, wordIndex: 0 });
    setActivePopover(null);
  };
  const handlePlayFromAyah = (ayah: Ayah) => {
    const listToPlay = displayedResults.length > 0 ? displayedResults : results;
    let startIndex = listToPlay.findIndex(a => 
      a.number === ayah.number || 
      (a.surah?.number === ayah.surah?.number && a.numberInSurah === ayah.numberInSurah)
    );
    if (startIndex !== -1) {
      onStartPlayback(listToPlay, selectedAudioEdition, startIndex, { isExplicitPlaylist: true });
    } else {
      onStartPlayback([ayah], selectedAudioEdition, 0, { isExplicitPlaylist: true });
    }
    setActivePopover(null);
  };

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto px-2 sm:px-4 overflow-x-hidden">
      {searchType !== 'number' && (
          <div className="mb-6 flex flex-col gap-3 max-w-full">
              <NeighboringWords neighboringWords={neighboringWords} visibleSuggestionsCount={visibleSuggestionsCount} onNeighborClick={(word) => onNewSearch(`${editableQuery.trim()} ${word}`)} onShowMore={handleShowMore}/>
          </div>
      )}
      
      <main className="bg-surface p-3.5 sm:p-6 md:p-8 rounded-lg shadow-md transition-colors duration-300 w-full max-w-full overflow-hidden">
        {searchType === 'text' && (
          <SearchFiltersDrawer 
            phraseFilters={phraseFilters}
            activePhraseFilter={activePhraseFilter}
            setActivePhraseFilter={setActivePhraseFilter}
            diacriticVariants={diacriticVariants}
            activeDiacriticFilter={activeDiacriticFilter}
            setActiveDiacriticFilter={setActiveDiacriticFilter}
            resultsCount={displayedResults.length}
            activeTab={filterActiveTab}
            onTabChange={setFilterActiveTab}
            sortOrder={filterSortOrder}
            onSortOrderChange={setFilterSortOrder}
          />
        )}
        <SearchResultsHeader 
            searchType={searchType} query={query} correctedQuery={correctedQuery} targetSurahNumber={targetSurahNumber} activeMuqattaatFilter={activeMuqattaatFilter} setActiveMuqattaatFilter={setActiveMuqattaatFilter} showMuqattaatInSearch={showMuqattaatInSearch} baseResults={muqattaatSourceResults}
            displayedResultsCount={displayedResults.length} resultsCount={displayedResults.length}
            isSingleWordSearch={isSingleWordSearch} generalOccurrences={generalOccurrences}
            exactOccurrences={exactOccurrences} exactMatch={exactMatch} setExactMatch={setExactMatch}
            totalOccurrences={totalOccurrences} onJumpToOccurrence={handleJumpToOccurrence}
            cachedAnalysisExists={cachedAnalysisExists} onNewSearch={onNewSearch}
            isRootSearch={isRootSearch}
            onToggleRootSearch={(val) => onNewSearch(query, undefined, undefined, val)}
            displayedResults={displayedResults}
            simpleCleanData={simpleCleanData}
            activePhraseFilter={activePhraseFilter}
            activeDiacriticFilter={activeDiacriticFilter}
            displayEditionData={effectiveEditionData}
            isDigitSum={isDigitSum}
            onToggleDigitSum={onToggleDigitSum}
            targetAyahNumber={targetNumberVal}
        />
        
        {results.length > 0 && (
          <>
            

            <SearchResultsToolbar
                isPlaybackLoading={isPlaybackLoading} allAudioEditions={ALL_AUDIO_EDITIONS}
                onPlayAll={handlePlayAll} 
                onPlayAllAsDhikr={handlePlayAllAsDhikr}
                selectedAudioEdition={selectedAudioEdition}
                onAudioEditionChange={setSelectedAudioEdition} searchType={searchType}
                onSaveSearch={handleSaveSearch} onCopyAll={handleCopyAll}
                isAllCopied={isAllCopied}
                onShareSearch={handleShareSearch}
                isShareCopied={isShareCopied}
                onCopyHighlightedWords={handleCopyHighlightedWords}
                isHighlightedCopied={isHighlightedCopied}
                copyHighlightedMode={copyHighlightedMode}
                copyHighlightedToast={copyHighlightedToast}
                highlightedWordsCount={phraseFilters.length}
                onDownloadAll={handleDownloadAll}
            />
          </>
        )}
        
        {/* In-Results Live Filter Bar & Match Status */}
        {displayedResults.length > 0 && (
          <div className="mt-4 mb-2 space-y-2">
            <div className="relative flex items-center bg-surface p-2 sm:p-2.5 rounded-xl border border-border-default shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <SearchIcon className="w-4 h-4 text-primary shrink-0 ml-2" />
                <input
                    type="text"
                    value={inResultsFilter}
                    onChange={(e) => setInResultsFilter(e.target.value)}
                    placeholder="تصفية فورية وتظليل داخل النتائج الحالية (مثال: الجنة، النار، الأيكة)..."
                    className="w-full bg-transparent border-none text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                    aria-label="تصفية فورية في النتائج الحالية"
                />
                {inResultsFilter && (
                    <button
                        type="button"
                        onClick={() => {
                            setInResultsFilter('');
                            window.dispatchEvent(new CustomEvent('quran-live-search', { detail: { query: '' } }));
                        }}
                        className="px-2.5 py-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-surface-hover transition-colors text-xs font-bold cursor-pointer"
                        title="إلغاء التصفية وعرض كل النتائج"
                    >
                        ✕ مسح
                    </button>
                )}
            </div>

            {inResultsFilter.trim() && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                            <span>🔍 تصفية نشطة:</span>
                            <span className="px-2 py-0.5 rounded-md bg-surface border border-emerald-500/30 text-text-primary font-bold">
                                "{inResultsFilter}"
                            </span>
                        </span>
                        <span className="text-text-secondary font-semibold font-mono">
                            ({filteredResults.length} من أصل {displayedResults.length} آية)
                        </span>
                        <span className="text-xs text-text-muted hidden md:inline">
                            • الكلمات معلمة ومظللة بالأخضر الفاقع
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setInResultsFilter('');
                            window.dispatchEvent(new CustomEvent('quran-live-search', { detail: { query: '' } }));
                        }}
                        className="px-3 py-1 rounded-lg bg-surface text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-border-default font-bold text-xs cursor-pointer transition-colors"
                    >
                        إلغاء التصفية
                    </button>
                </div>
            )}
          </div>
        )}

        <div className="mt-4">
            {displayedResults.length > 0 ? (
                <>
                    {filteredResults.length === 0 ? (
                        <div className="p-8 text-center bg-surface-subtle border border-border-default rounded-2xl space-y-3">
                            <div className="text-3xl">🔍</div>
                            <div className="text-base font-bold text-text-primary">
                                لا توجد آيات تحتوي على "{inResultsFilter}" ضمن نتائج البحث الحالية عن "{query}"
                            </div>
                            <p className="text-xs text-text-muted">
                                يمكنك إلغاء التصفية للعودة لكافة النتائج ({displayedResults.length} آية)، أو الضغط على مفتاح الإدخال ↵ للبحث عنها في كامل المصحف الشريف.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setInResultsFilter('');
                                    window.dispatchEvent(new CustomEvent('quran-live-search', { detail: { query: '' } }));
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                            >
                                إلغاء التصفية وعرض كل النتائج
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {paginatedResults.map((ayah, index) => {
                                const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah?.number);
                                const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
                                return (
                                    <SearchResultItem 
                                        key={ayah.number} itemRef={itemRefs.current[index]} ayah={ayah} 
                                        queryWords={searchType === 'number' ? [] : queryWords} currentQuery={query} onNewSearch={onNewSearch}
                                        displayEdition={displayEdition} displayEditionData={displayEditionData} searchEdition={searchEdition}
                                        imlaeiSimpleData={imlaeiSimpleData}
                                        simpleCleanData={simpleCleanData}
                                        fontSize={fontSize} fontStyle={fontStyle} searchType={searchType} isCurrentlyPlaying={ayah.number === currentlyPlayingAyahGlobalNumber}
                                        isPlaybackLoading={isPlaybackLoading}
                                        pulsingWordIndex={pulsingWord?.itemIndex === index ? pulsingWord.wordIndex : -1} resultIndex={index}
                                        simpleAyahText={simpleAyah?.text || ''}
                                        onUthmaniWordClick={handleUthmaniWordClick}
                                        onSaveAyah={handleSaveClick}
                                        onCopyAyah={handleCopyAyah}
                                        onPlayAyah={handlePlaySingleAyah}
                                        copiedAyah={copiedAyah}
                                        isDigitSum={isDigitSum}
                                        targetAyahNumber={targetNumberVal}
                                        inResultsFilter={inResultsFilter}
                                    />
                               );
                            })}
                        </ul>
                    )}

                    {filteredResults.length > visibleCount && (
                        <div ref={loadMoreSentinelRef} className="mt-8 py-6 px-4 bg-surface-subtle border border-border-default rounded-2xl text-center space-y-3 shadow-xs">
                            <div className="text-sm font-bold text-text-primary">
                                تم عرض <span className="text-primary font-mono">{visibleCount}</span> من إجمالي <span className="text-primary font-mono">{filteredResults.length}</span> آية
                            </div>
                            <p className="text-xs text-text-muted">
                                اسحب للأسفل لعرض المزيد تلقائياً، أو انقر أحد الخيارات التالية:
                            </p>
                            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                                <button
                                    onClick={() => setVisibleCount(prev => Math.min(prev + 50, filteredResults.length))}
                                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-2"
                                >
                                    <SearchIcon className="w-4 h-4" />
                                    <span>عرض 50 آية إضافية</span>
                                </button>
                                <button
                                    onClick={() => setVisibleCount(filteredResults.length)}
                                    className="px-4 py-2.5 bg-surface text-text-primary border border-border-default hover:bg-surface-hover rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer shadow-2xs"
                                >
                                    عرض كل النتائج ({filteredResults.length})
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (<div className="text-center p-10 text-lg text-text-muted">لم يتم العثور على نتائج.</div>)}
        </div>
      </main>
      
       {wordPopoverState && (
         <div ref={wordPopoverRef} className="absolute p-3 bg-surface rounded-lg shadow-lg border border-border-default flex items-center gap-2 z-20 animate-fade-in flex-wrap leading-loose"
            style={(() => {
                if (!wordPopoverState.triggerElement) return { opacity: 0, top: 0, left: 0 };
                const rect = wordPopoverState.triggerElement.getBoundingClientRect();
                return { top: `${rect.bottom + window.scrollY + 5}px`, left: `${rect.left + window.scrollX + rect.width / 2}px`, transform: 'translateX(-50%)' };
            })()}
        >
            {wordPopoverState.simpleText.split(' ').map((word, wordIndex) => {
                const originalAyah = displayedResults[wordPopoverState.resultIndex];
                return (
                    <button key={wordIndex} onClick={() => { onNewSearch(word, 'quran-simple-clean', { surah: originalAyah.surah!.number, ayah: originalAyah.numberInSurah, wordIndex: wordIndex }); setWordPopoverState(null); }} className="px-2 py-1 bg-surface-subtle rounded-md hover:bg-primary/20 transition-colors">
                        {word}
                    </button>
                );
            })}
        </div>
      )}

       {activePopover && <AyahActionPopover activePopover={activePopover} onClose={() => setActivePopover(null)} onSave={handleSaveClick} onCopy={handleCopyAyah} onSearchText={handleSearchByAyahText} onSearchNumber={onSearchByAyahNumber} onPlayFrom={handlePlayFromAyah} copiedAyah={copiedAyah} />}

       {isDhikrModalOpen && (
         <DhikrModal
           isOpen={isDhikrModalOpen}
           onClose={() => setIsDhikrModalOpen(false)}
           repeatAyahTarget={dhikrRepeatAyah}
           setRepeatAyahTarget={setDhikrRepeatAyah}
           repeatPlaylistTarget={dhikrRepeatPlaylist}
           setRepeatPlaylistTarget={setDhikrRepeatPlaylist}
           delaySeconds={dhikrDelay}
           setDelaySeconds={setDhikrDelay}
           onStartPlayback={handleStartDhikrPlayback}
           playlistLength={displayedResults.length}
         />
       )}
    </div>
  );
};