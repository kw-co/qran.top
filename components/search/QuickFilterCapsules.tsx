import React, { useState, useMemo, useCallback } from 'react';
import type { PhraseFilterItem, DiacriticVariantItem } from './SearchFiltersDrawer';
import type { Ayah } from '../../types';
import FormattedDiacriticWord from './FormattedDiacriticWord';
import { ClearIcon, CheckIcon, DocumentDuplicateIcon, ListBulletIcon } from '../icons';
import { escapeRegExp, formatSurahNameForDisplay, copyToClipboard, normalizeArabicText } from '../../utils/text';

interface QuickFilterCapsulesProps {
  diacriticVariants: DiacriticVariantItem[];
  activeDiacriticFilter: string;
  onSelectDiacritic: (diacritic: string) => void;
  phraseFilters: PhraseFilterItem[];
  activePhraseFilter: string;
  onSelectPhrase: (phrase: string) => void;
  resultsCount: number;
  totalResultsCount?: number;
  neighboringWords?: string[];
  onNeighborClick?: (word: string) => void;
  // Detailed analysis copy props
  query?: string;
  allResults?: Ayah[];
  displayedResults?: Ayah[];
  displayEditionData?: any[];
}

const INITIAL_LIMIT = 8;

const cleanVoweledText = (text: string | undefined | null): string => {
  if (!text) return '';
  return String(text)
    .replace(/[\u0610-\u061A\u06D6-\u06ED۝۞۩*٭★☆✪✦✧𖣔܍֍«»﴿﴾\(\)\[\]"'ـ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const QuickFilterCapsules: React.FC<QuickFilterCapsulesProps> = ({
  diacriticVariants,
  activeDiacriticFilter,
  onSelectDiacritic,
  phraseFilters,
  activePhraseFilter,
  onSelectPhrase,
  resultsCount,
  totalResultsCount,
  neighboringWords = [],
  onNeighborClick,
  query,
  allResults = [],
  displayedResults = [],
  displayEditionData = [],
}) => {
  const [activeMode, setActiveMode] = useState<'diacritics' | 'phrases' | 'neighbors'>(
    diacriticVariants.length > 1 ? 'diacritics' : phraseFilters.length > 1 ? 'phrases' : 'diacritics'
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopiedDetailed, setIsCopiedDetailed] = useState(false);

  const activeDiacriticTokens = useMemo(() => {
    if (!activeDiacriticFilter || activeDiacriticFilter.trim() === '') return [];
    return activeDiacriticFilter.split(',').map(s => s.trim()).filter(Boolean);
  }, [activeDiacriticFilter]);

  const activePhraseTokens = useMemo(() => {
    if (!activePhraseFilter || activePhraseFilter === 'all') return [];
    return activePhraseFilter.split(',').map(s => s.trim()).filter(Boolean);
  }, [activePhraseFilter]);

  const hasMultipleDiacritics = diacriticVariants.length > 1;
  const hasPhrases = phraseFilters.length > 0;
  const hasNeighbors = neighboringWords.length > 0;

  // Multi-select toggle for diacritic variants
  const handleToggleDiacritic = (word: string) => {
    const next = activeDiacriticTokens.includes(word)
      ? activeDiacriticTokens.filter(t => t !== word)
      : [...activeDiacriticTokens, word];
    onSelectDiacritic(next.join(','));
  };

  // Multi-select toggle for phrase filters
  const handleTogglePhrase = (phrase: string) => {
    const next = activePhraseTokens.includes(phrase)
      ? activePhraseTokens.filter(t => t !== phrase)
      : [...activePhraseTokens, phrase];
    onSelectPhrase(next.length === 0 ? 'all' : next.join(','));
  };

  const handleClearAll = () => {
    if (activeDiacriticTokens.length > 0) onSelectDiacritic('');
    if (activePhraseTokens.length > 0) onSelectPhrase('all');
  };

  const handleModeChange = (mode: 'diacritics' | 'phrases' | 'neighbors') => {
    setActiveMode(mode);
    setIsExpanded(false);
  };

  const hasAnyFilterActive = activeDiacriticTokens.length > 0 || activePhraseTokens.length > 0;

  // Sliced items calculation with safe fallback for active tokens
  const currentTotalCount = 
    activeMode === 'diacritics' ? diacriticVariants.length :
    activeMode === 'phrases' ? phraseFilters.length :
    neighboringWords.length;

  const visibleDiacritics = useMemo(() => {
    if (isExpanded || diacriticVariants.length <= INITIAL_LIMIT) {
      return diacriticVariants;
    }
    const initial = diacriticVariants.slice(0, INITIAL_LIMIT);
    // Always include any active tokens that are outside the first INITIAL_LIMIT
    const activeBeyond = diacriticVariants
      .slice(INITIAL_LIMIT)
      .filter(item => activeDiacriticTokens.includes(item.word));
    return [...initial, ...activeBeyond];
  }, [isExpanded, diacriticVariants, activeDiacriticTokens]);

  const visiblePhrases = useMemo(() => {
    if (isExpanded || phraseFilters.length <= INITIAL_LIMIT) {
      return phraseFilters;
    }
    const initial = phraseFilters.slice(0, INITIAL_LIMIT);
    const activeBeyond = phraseFilters
      .slice(INITIAL_LIMIT)
      .filter(item => activePhraseTokens.includes(item.phrase));
    return [...initial, ...activeBeyond];
  }, [isExpanded, phraseFilters, activePhraseTokens]);

  const visibleNeighbors = useMemo(() => {
    if (isExpanded || neighboringWords.length <= INITIAL_LIMIT) {
      return neighboringWords;
    }
    return neighboringWords.slice(0, INITIAL_LIMIT);
  }, [isExpanded, neighboringWords]);

  /**
   * Detailed Categorized Copy:
   * Copies each selected (or all available when none selected) diacritic variant/phrase
   * separately into its own distinct section with exact occurrences, Surah name,
   * Ayah number, and vocalized Quranic text in brackets ﴿...﴾.
   */
  const handleCopyDetailedAnalysis = useCallback(async () => {
    // 1. Determine target tokens based on active mode (if none selected, copy ALL available)
    let targetItems: { token: string; expectedCount: number }[] = [];
    let modeLabel = '';

    if (activeMode === 'diacritics') {
      if (activeDiacriticTokens.length > 0) {
        targetItems = activeDiacriticTokens.map(w => {
          const found = diacriticVariants.find(v => v.word === w || cleanVoweledText(v.word) === cleanVoweledText(w));
          return { token: w, expectedCount: found?.count || 0 };
        });
      } else {
        targetItems = diacriticVariants.map(v => ({ token: v.word, expectedCount: v.count }));
      }
      modeLabel = 'شيفرة الهدهد';
    } else if (activeMode === 'phrases') {
      if (activePhraseTokens.length > 0) {
        targetItems = activePhraseTokens.map(p => {
          const found = phraseFilters.find(f => f.phrase === p);
          return { token: p, expectedCount: found?.count || 0 };
        });
      } else {
        targetItems = phraseFilters.map(p => ({ token: p.phrase, expectedCount: p.count }));
      }
      modeLabel = 'التراكيب المقترنة';
    }

    if (targetItems.length === 0) return;

    // 2. Determine base pool of ayahs to match against
    const pool = (allResults && allResults.length > 0) ? allResults : (displayedResults || []);

    // 3. Collect categorized results for each target item
    const sections: {
      token: string;
      ayahCount: number;
      wordOccurrences: number;
      ayahs: {
        surahName: string;
        ayahNumber: number;
        text: string;
      }[];
    }[] = [];

    for (const { token } of targetItems) {
      const cleanTarget = cleanVoweledText(token);
      const normTarget = normalizeArabicText(token);
      const matchedAyahs: {
        surahName: string;
        ayahNumber: number;
        text: string;
      }[] = [];
      let totalWordOccurrences = 0;

      for (const ayah of pool) {
        const sNum = ayah.surah?.number || (typeof ayah.surah === 'number' ? ayah.surah : 0);
        const displaySurah = displayEditionData?.find((s: any) => s.number === sNum);
        const displayAyah = displaySurah?.ayahs?.find((a: any) => a.numberInSurah === ayah.numberInSurah);
        const rawText = String(displayAyah?.text || ayah.text || '').trim();
        if (!rawText) continue;

        let matchesInThisAyah = 0;

        if (activeMode === 'diacritics') {
          const cleanAyah = cleanVoweledText(rawText);
          const ayahWords = cleanAyah.split(' ').filter(Boolean);

          if (!cleanTarget.includes(' ')) {
            matchesInThisAyah = ayahWords.filter(w => w === cleanTarget).length;
          } else {
            const targetParts = cleanTarget.split(' ').filter(Boolean);
            for (let i = 0; i <= ayahWords.length - targetParts.length; i++) {
              let ok = true;
              for (let j = 0; j < targetParts.length; j++) {
                if (ayahWords[i + j] !== targetParts[j]) {
                  ok = false;
                  break;
                }
              }
              if (ok) matchesInThisAyah++;
            }
          }
        } else {
          // Phrases mode uses normalized Arabic matching (same as useSearchLogic phraseFilters)
          const normAyah = normalizeArabicText(ayah.text || rawText);
          const normAyahWords = normAyah.split(/\s+/).filter(Boolean);

          if (!normTarget.includes(' ')) {
            matchesInThisAyah = normAyahWords.filter(w => w === normTarget).length;
          } else {
            const escaped = escapeRegExp(normTarget);
            const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'g');
            const m = normAyah.match(regex);
            matchesInThisAyah = m ? m.length : (normAyah.includes(normTarget) ? 1 : 0);
          }
        }

        if (matchesInThisAyah > 0) {
          totalWordOccurrences += matchesInThisAyah;
          const rawSurahName = displaySurah?.name || ayah.surah?.name || '';
          const cleanSurahName = formatSurahNameForDisplay(rawSurahName) || `سورة ${sNum}`;
          const cleanVocalized = rawText.replace(/[\u06D6-\u06ED]/g, '').trim();

          matchedAyahs.push({
            surahName: cleanSurahName,
            ayahNumber: ayah.numberInSurah,
            text: cleanVocalized,
          });
        }
      }

      sections.push({
        token,
        ayahCount: matchedAyahs.length,
        wordOccurrences: totalWordOccurrences,
        ayahs: matchedAyahs,
      });
    }

    const totalAyahsAcrossSections = sections.reduce((acc, sec) => acc + sec.ayahCount, 0);

    // 4. Build clean, structured output separated by variant
    let reportText = `══════════════════════════════════════════════════
تفصيل نتائج (${modeLabel}) - البحث عن: «${query || ''}»
• عدد الصيغ المفصلة: ${sections.length}
• مجموع الشواهد القرآنية: ${totalAyahsAcrossSections} آية
══════════════════════════════════════════════════\n\n`;

    sections.forEach((sec, idx) => {
      const countDisplay = sec.ayahCount;
      const timesStr = countDisplay === 1 ? 'مرة واحدة' : countDisplay === 2 ? 'مرتان' : countDisplay <= 10 ? `${countDisplay} مرات` : `${countDisplay} مرة`;

      reportText += `[${idx + 1}] الصيغة: «${sec.token}» — وردت في (${timesStr})\n`;

      if (sec.ayahs.length === 0) {
        reportText += `  (لا توجد آيات مطابقة)\n`;
      } else {
        sec.ayahs.forEach((a, aIdx) => {
          reportText += `  ${aIdx + 1}. ﴿${a.text}﴾ [سورة ${a.surahName}: ${a.ayahNumber}]\n`;
        });
      }

      if (idx < sections.length - 1) {
        reportText += `\n──────────────────────────────────────────────────\n\n`;
      }
    });

    reportText += `\n══════════════════════════════════════════════════\n`;

    // 5. Copy to clipboard
    const success = await copyToClipboard(reportText);
    if (success) {
      setIsCopiedDetailed(true);
      setTimeout(() => setIsCopiedDetailed(false), 2500);
    }
  }, [
    activeMode,
    activeDiacriticTokens,
    diacriticVariants,
    activePhraseTokens,
    phraseFilters,
    allResults,
    displayedResults,
    displayEditionData,
    query,
  ]);

  // Conditions to show detailed categorized copy button
  const showDetailedCopyButton = 
    (activeMode === 'diacritics' && (hasMultipleDiacritics || activeDiacriticTokens.length > 0)) ||
    (activeMode === 'phrases' && (phraseFilters.length > 1 || activePhraseTokens.length > 0));

  // If there are no diacritics, phrases or neighbors, no need to show capsules
  if (!hasMultipleDiacritics && !hasPhrases && !hasNeighbors && activeDiacriticTokens.length === 0 && activePhraseTokens.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 bg-surface-subtle/70 hover:bg-surface-subtle border border-border-default rounded-xl p-2.5 sm:p-3 transition-colors shadow-2xs">
      {/* Top Header: Mode Switcher & Active Filter Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-subtle text-xs font-bold">
          {hasMultipleDiacritics && (
            <button
              type="button"
              onClick={() => handleModeChange('diacritics')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'diacritics'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>شيفرة الهدهد</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                activeMode === 'diacritics' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
              }`}>
                {diacriticVariants.length}
              </span>
            </button>
          )}

          {hasPhrases && (
            <button
              type="button"
              onClick={() => handleModeChange('phrases')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'phrases'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>التراكيب المقترنة</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                activeMode === 'phrases' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
              }`}>
                {phraseFilters.length}
              </span>
            </button>
          )}

          {hasNeighbors && onNeighborClick && (
            <button
              type="button"
              onClick={() => handleModeChange('neighbors')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'neighbors'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>الكلمات المجاورة</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                activeMode === 'neighbors' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
              }`}>
                {neighboringWords.length}
              </span>
            </button>
          )}
        </div>

        {/* Action Controls: Dual-Icon Detailed Copy + Clear Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Dual-Icon Detailed Categorized Copy Button (No text caption) */}
          {showDetailedCopyButton && (
            <button
              type="button"
              onClick={handleCopyDetailedAnalysis}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs border ${
                isCopiedDetailed
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25 hover:border-primary/40'
              }`}
              title={
                activeDiacriticTokens.length > 0 || activePhraseTokens.length > 0
                  ? 'نسخ مفصل للصيغ المحددة (كل صيغة مع آياتها على حدى)'
                  : 'نسخ مفصل لجميع الصيغ (كل صيغة مع آياتها على حدى)'
              }
              aria-label="نسخ مفصل للصيغ"
            >
              {isCopiedDetailed ? (
                <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-4 h-4 shrink-0" />
                  <ListBulletIcon className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          )}

          {/* Clear Filters Indicator */}
          {hasAnyFilterActive && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
              title="إلغاء جميع الفلاتر النشطة"
            >
            <ClearIcon className="w-3.5 h-3.5" />
            <span>عرض كل النتائج ({totalResultsCount ?? resultsCount})</span>
          </button>
          )}
        </div>
      </div>

      {/* Vertical / Multi-Line Wrapped Capsules (Clean Flow on Mobile & Desktop) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {/* "الكل" (All) tool button - distinct dashed/double tool border to distinguish from Quranic words */}
        <button
          type="button"
          onClick={handleClearAll}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border-2 border-dashed ${
            !hasAnyFilterActive
              ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-500/70 shadow-2xs'
              : 'bg-surface-subtle text-text-secondary border-border-default hover:border-amber-500/50 hover:text-text-primary'
          }`}
          title="إلغاء التصفية وعرض جميع النتائج"
        >
          <span>الكل</span>
          <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
            !hasAnyFilterActive ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200' : 'bg-surface text-text-muted'
          }`}>
            {totalResultsCount ?? resultsCount}
          </span>
        </button>

        {/* Mode: شيفرة الهدهد (Diacritic Variants) - Fixed dimensions on selection (color-only change) */}
        {activeMode === 'diacritics' && visibleDiacritics.map((item) => {
          const isSelected = activeDiacriticTokens.includes(item.word);
          return (
            <button
              key={item.word}
              type="button"
              onClick={() => handleToggleDiacritic(item.word)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-2xs'
                  : 'bg-surface text-text-primary border-border-default hover:border-primary/40 hover:bg-surface-hover'
              }`}
            >
              <span className="leading-none">
                <FormattedDiacriticWord
                  word={item.word}
                  isActive={isSelected}
                  fontSizeClass="text-sm sm:text-base"
                />
              </span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
              }`}>
                {item.count}
              </span>
            </button>
          );
        })}

        {/* Mode: التراكيب المقترنة (Phrases) - Fixed dimensions on selection (color-only change) */}
        {activeMode === 'phrases' && visiblePhrases.map((item) => {
          const isSelected = activePhraseTokens.includes(item.phrase);
          return (
            <button
              key={item.phrase}
              type="button"
              onClick={() => handleTogglePhrase(item.phrase)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-2xs'
                  : 'bg-surface text-text-primary border-border-default hover:border-primary/40 hover:bg-surface-hover'
              }`}
            >
              <span>{item.phrase}</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
              }`}>
                {item.count}
              </span>
            </button>
          );
        })}

        {/* Mode: الكلمات المجاورة (Neighboring Words) */}
        {activeMode === 'neighbors' && visibleNeighbors.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => onNeighborClick && onNeighborClick(word)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface text-text-primary border border-border-default hover:border-primary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-1"
            title={`إضافة كلمة "${word}" للبحث`}
          >
            <span>+ {word}</span>
          </button>
        ))}

        {/* Expand / Collapse Tool Button - distinct dashed tool border */}
        {currentTotalCount > INITIAL_LIMIT && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border-2 border-dashed border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
          >
            {isExpanded ? (
              <>
                <span>عرض أقل</span>
                <span className="text-[10px]">▲</span>
              </>
            ) : (
              <>
                <span>عرض المزيد (+{currentTotalCount - INITIAL_LIMIT})</span>
                <span className="text-[10px]">▼</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickFilterCapsules;
