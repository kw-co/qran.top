import React, { useState } from 'react';
import { 
  SearchIcon, PlayIcon, SpinnerIcon, DocumentDuplicateIcon, 
  ShareIcon, CheckIcon, DownloadIcon, BookmarkIcon
} from '../icons';
import { QURAN_INDEX } from '../../quranIndex';
import { FULL_29_MUQATTAAT_LIST } from './SearchResultsHeader';

interface MuqattaatStatItem {
  surah: number;
  name: string;
  letters: string;
  count: number;
  ayahsCount: number;
  isMentioned: boolean;
  isDisplayed: boolean;
  isFilterActive: boolean;
  isSurahFiltered: boolean;
  isFormulaFiltered: boolean;
}

interface UnifiedSearchHeaderBarProps {
  searchType: 'text' | 'number';
  query: string;
  correctedQuery?: string;
  targetSurahNumber?: number;
  displayedResultsCount: number;
  totalResultsCount: number;
  isSingleWordSearch: boolean;
  generalOccurrences: number;
  exactOccurrences: number;
  exactMatch: boolean;
  setExactMatch: (val: boolean) => void;
  isRootSearch?: boolean;
  onToggleRootSearch?: (val: boolean) => void;
  isDigitSum?: boolean;
  onToggleDigitSum?: (val: boolean) => void;
  // Muqattaat active filter and map drawer props
  allMuqattaatStats?: MuqattaatStatItem[];
  activeMuqattaatFilter?: string;
  onSelectMuqattaatFilter?: (filter: string) => void;
  onClearMuqattaatFilter?: () => void;
  // Action handlers placed directly outside
  onPlayAll: () => void;
  isPlaybackLoading: boolean;
  onCopyAll: () => void;
  isAllCopied: boolean;
  onDownloadAll?: () => void;
  onShareSearch: () => void;
  isShareCopied: boolean;
  onSaveSearch?: () => void;
  onCopyHighlightedWords?: () => void;
  isHighlightedCopied?: boolean;
  highlightedWordsCount?: number;
  copyHighlightedToast?: string;
  onNewSearch: (query: string) => void;
}

export const UnifiedSearchHeaderBar: React.FC<UnifiedSearchHeaderBarProps> = ({
  searchType,
  query,
  correctedQuery,
  targetSurahNumber,
  displayedResultsCount,
  totalResultsCount,
  isSingleWordSearch,
  generalOccurrences,
  exactOccurrences,
  exactMatch,
  setExactMatch,
  isRootSearch = false,
  onToggleRootSearch,
  isDigitSum = false,
  onToggleDigitSum,
  allMuqattaatStats = [],
  activeMuqattaatFilter = '',
  onSelectMuqattaatFilter,
  onClearMuqattaatFilter,
  onPlayAll,
  isPlaybackLoading,
  onCopyAll,
  isAllCopied,
  onDownloadAll,
  onShareSearch,
  isShareCopied,
  onSaveSearch,
  onCopyHighlightedWords,
  isHighlightedCopied,
  highlightedWordsCount = 0,
  copyHighlightedToast,
  onNewSearch,
}) => {
  const [isMuqattaatOpen, setIsMuqattaatOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('qran_muqattaat_open') === 'true';
    } catch {
      return false;
    }
  });
  const [hoveredSurah, setHoveredSurah] = useState<MuqattaatStatItem | null>(null);

  const toggleMuqattaat = () => {
    const nextState = !isMuqattaatOpen;
    setIsMuqattaatOpen(nextState);
    try {
      localStorage.setItem('qran_muqattaat_open', String(nextState));
    } catch {}
  };

  const handleSurahClick = (item: MuqattaatStatItem) => {
    if (!onSelectMuqattaatFilter) return;
    const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
    const surahKey = `s:${item.surah}`;
    
    let nextFilters: string[];
    if (currentFilters.includes(surahKey)) {
      nextFilters = currentFilters.filter(f => f !== surahKey);
    } else if (currentFilters.includes(item.letters)) {
      nextFilters = currentFilters.filter(f => f !== item.letters);
      nextFilters.push(surahKey);
    } else {
      nextFilters = [...currentFilters, surahKey];
    }
    onSelectMuqattaatFilter(nextFilters.join(','));
  };

  const handleFormulaClick = (formula: string) => {
    if (!onSelectMuqattaatFilter) return;
    const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
    let nextFilters: string[];
    if (currentFilters.includes(formula)) {
      nextFilters = currentFilters.filter(f => f !== formula);
    } else {
      const formulaSurahKeys = FULL_29_MUQATTAAT_LIST.filter(s => s.letters === formula).map(s => `s:${s.surah}`);
      nextFilters = currentFilters.filter(f => !formulaSurahKeys.includes(f));
      nextFilters.push(formula);
    }
    onSelectMuqattaatFilter(nextFilters.join(','));
  };

  const targetSurahObj = targetSurahNumber ? QURAN_INDEX[targetSurahNumber - 1] : null;

  return (
    <div className="mb-4 bg-surface rounded-2xl border border-border-default shadow-xs overflow-hidden transition-all">
      {/* Discreet spelling correction banner if applicable */}
      {correctedQuery && !isRootSearch && (
        <div className="px-4 py-2.5 bg-blue-500/10 border-b border-blue-500/20 text-xs text-text-secondary flex items-center justify-between gap-2 flex-wrap">
          <span>
            لم نجد نتائج لـ "{query}". نعرض أقرب لفظ: <strong className="text-primary font-bold">{correctedQuery}</strong>
          </span>
          <button 
            onClick={() => onNewSearch(query)} 
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            البحث عن "{query}" كما هي
          </button>
        </div>
      )}

      {/* Main Unified Command Bar */}
      <div className="p-3.5 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Query title + stats + fast toggles */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-1.5 flex-wrap">
              <span className="text-text-secondary text-sm font-normal">
                {searchType === 'number' ? 'الآيات رقم:' : isRootSearch ? 'جذر:' : 'نتائج البحث عن:'}
              </span>
              <span className="text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                {searchType === 'number' ? query : String(correctedQuery || query).replace(/"/g, '')}
              </span>
            </h2>

            {targetSurahObj && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-subtle border border-border-default text-text-secondary">
                في {targetSurahObj.name}
              </span>
            )}

            {/* Total count pill */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              {displayedResultsCount} آية
            </span>

            {/* Occurrences count (if single word) */}
            {searchType === 'text' && isSingleWordSearch && !isRootSearch && generalOccurrences > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30" title="إجمالي مرات ورود الكلمة">
                {generalOccurrences} تكراراً
              </span>
            )}

            {/* Active Muqattaat filter pill */}
            {activeMuqattaatFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <span>تصفية: {activeMuqattaatFilter}</span>
                {onClearMuqattaatFilter && (
                  <button
                    type="button"
                    onClick={onClearMuqattaatFilter}
                    className="hover:text-red-500 px-0.5 cursor-pointer"
                    title="إلغاء تصفية السور"
                  >
                    ✕
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Quick Mode Toggles (Single click toggles) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {searchType === 'text' && isSingleWordSearch && !isRootSearch && (
              <button
                type="button"
                onClick={() => setExactMatch(!exactMatch)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  exactMatch
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-surface-subtle text-text-secondary border border-border-default hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="تفعيل المطابقة التامة للحروف فقط"
              >
                <span>{exactMatch ? '✓' : '🎯'}</span>
                <span>مطابقة تامة ({exactOccurrences})</span>
              </button>
            )}

            {searchType === 'text' && (isSingleWordSearch || isRootSearch) && onToggleRootSearch && (
              <button
                type="button"
                onClick={() => onToggleRootSearch(!isRootSearch)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isRootSearch
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-surface-subtle text-text-secondary border border-border-default hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="البحث عن كافة تصريفات ومشتقات هذا الجذر"
              >
                <span>🌱</span>
                <span>{isRootSearch ? 'البحث بالجذر (مُفعّل)' : 'البحث بالجذر'}</span>
              </button>
            )}

            {searchType === 'number' && onToggleDigitSum && (
              <button
                type="button"
                onClick={() => onToggleDigitSum(!isDigitSum)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isDigitSum
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-surface-subtle text-text-secondary border border-border-default hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="إظهار الآيات التي يساوي مجموع أرقامها هذا الرقم"
              >
                <span>🧮</span>
                <span>{isDigitSum ? 'مجموع الأرقام (مُفعّل)' : 'مجموع أرقام الآيات'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Buttons (All directly outside, no Tools button, no Dhikr button) */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Play All */}
          <button
            type="button"
            onClick={onPlayAll}
            disabled={isPlaybackLoading || displayedResultsCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="تشغيل متتالٍ لآيات النتائج"
          >
            {isPlaybackLoading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
            <span>تشغيل الكل</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={onCopyAll}
            disabled={isAllCopied || displayedResultsCount === 0}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default transition-all cursor-pointer shadow-2xs"
            title="نسخ الآيات المطابقة للحافظة"
            aria-label="نسخ جميع النتائج"
          >
            {isAllCopied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
          </button>

          {/* Download Text File (Export) */}
          {onDownloadAll && (
            <button
              type="button"
              onClick={onDownloadAll}
              disabled={displayedResultsCount === 0}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default transition-all cursor-pointer shadow-2xs"
              title="تحميل نتائج البحث كملف نصي (TXT)"
              aria-label="تحميل النتائج كملف"
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
          )}

          {/* Share */}
          <button
            type="button"
            onClick={onShareSearch}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default transition-all cursor-pointer shadow-2xs"
            title="مشاركة رابط البحث مع الفلاتر"
            aria-label="مشاركة رابط البحث"
          >
            {isShareCopied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <ShareIcon className="w-4 h-4" />}
          </button>

          {/* Save Search Bookmark */}
          {onSaveSearch && searchType === 'text' && (
            <button
              type="button"
              onClick={onSaveSearch}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default transition-all cursor-pointer shadow-2xs"
              title="حفظ البحث في المفضلة"
              aria-label="حفظ البحث في المفضلة"
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>
          )}

          {/* Copy Highlighted Words (if present) */}
          {onCopyHighlightedWords && highlightedWordsCount > 0 && (
            <button
              type="button"
              onClick={onCopyHighlightedWords}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default transition-all cursor-pointer shadow-2xs"
              title={copyHighlightedToast || "نسخ الألفاظ المستخرجة وتكرارها"}
              aria-label="نسخ الكلمات المظللة"
            >
              {isHighlightedCopied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
              <span className="hidden sm:inline font-mono text-[11px]">({highlightedWordsCount})</span>
            </button>
          )}

          {/* Noorani Surahs 29-Map Button - Icon ONLY, no caption */}
          {searchType === 'text' && allMuqattaatStats && allMuqattaatStats.length > 0 && (
            <button
              type="button"
              onClick={toggleMuqattaat}
              className={`p-2 rounded-xl transition-all cursor-pointer shadow-2xs border ${
                isMuqattaatOpen
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : activeMuqattaatFilter
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : 'text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface border border-border-default'
              }`}
              title="خريطة السور النورانية الـ 29 (فتح/إغلاق)"
              aria-label="خريطة السور النورانية"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Slide-down Noorani Surahs 29-Map Drawer (سحاب بيفتح ويسكر - منمنم بسطرين أو ثلاثة) */}
      {isMuqattaatOpen && allMuqattaatStats && allMuqattaatStats.length > 0 && (
        <div className="border-t border-border-subtle p-2.5 sm:p-3 bg-surface-subtle/90 animate-fade-in space-y-2">
          {/* Dynamic Top Hint & Info Banner */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-border-default text-xs min-h-[34px]">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {hoveredSurah ? (
                <>
                  <span className="font-bold text-text-primary text-xs sm:text-sm">
                    سورة {hoveredSurah.name} ({hoveredSurah.surah})
                  </span>
                  <span className="font-uthmani text-xs sm:text-sm font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    فاتحتها: [{hoveredSurah.letters}]
                  </span>
                  {hoveredSurah.isMentioned ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded text-[11px] sm:text-xs">
                      وردت {hoveredSurah.count} مرة في {hoveredSurah.ayahsCount} آية
                    </span>
                  ) : (
                    <span className="text-text-muted text-[11px]">
                      لم ترد في هذه السورة
                    </span>
                  )}
                </>
              ) : (
                <span className="text-text-muted text-[11px]">
                  مرّر الفأرة أو انقر على أي فاتحة لعرض اسم السورة وتكرارها وتصفيتها
                </span>
              )}
            </div>

            {activeMuqattaatFilter && onSelectMuqattaatFilter && (
              <button
                type="button"
                onClick={() => onSelectMuqattaatFilter('')}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer shrink-0"
              >
                إلغاء التصفية ✕
              </button>
            )}
          </div>

          {/* Compact Chips: Letters + Count only (Fits in 2-3 rows) */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center justify-center sm:justify-start">
            {allMuqattaatStats.map((item) => (
              <button
                key={item.surah}
                type="button"
                onMouseEnter={() => setHoveredSurah(item)}
                onClick={() => {
                  setHoveredSurah(item);
                  handleSurahClick(item);
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none ${
                  item.isFilterActive
                    ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/30 scale-105'
                    : item.isMentioned
                    ? 'bg-surface hover:bg-primary/10 border-border-default text-text-primary hover:border-primary/50 shadow-2xs'
                    : 'bg-surface/50 hover:bg-surface border-border-subtle/60 text-text-muted/70 opacity-60 hover:opacity-100'
                }`}
                title={`سورة ${item.name} (${item.surah}) - فاتحتها [${item.letters}] - تكررت ${item.count} مرة`}
                aria-label={`سورة ${item.name}`}
              >
                <span className="font-uthmani font-bold text-xs sm:text-sm">{item.letters}</span>
                <span className={`px-1 py-0.2 rounded font-mono text-[10px] font-bold ${
                  item.count > 0 
                    ? (item.isFilterActive ? 'bg-white/25 text-white' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')
                    : 'bg-black/5 dark:bg-white/5 text-text-muted'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearchHeaderBar;
