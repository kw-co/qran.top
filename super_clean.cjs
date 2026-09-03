const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

const lastExport = content.lastIndexOf('export const SearchView: React.FC<SearchViewProps> =');
if (lastExport === -1) {
    console.error("Not found");
    process.exit(1);
}
let body = content.substring(lastExport);
let importsAndProps = content.substring(0, content.indexOf('export const SearchView: React.FC<SearchViewProps> ='));

// Wait, the imports might be corrupted because of the earlier sed!
// I'll just write clean imports.
const cleanImports = `import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, ClearIcon, DocumentDuplicateIcon } from './icons';
import { normalizeArabicText, formatSurahNameForDisplay, formatAyahForCopy } from '../utils/text';
import { useSearchLogic } from '../hooks/useSearchLogic';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';
import AyahActionPopover from './AyahActionPopover';
import SearchResultItem from './SearchResultItem';
import SearchResultsHeader from './search/SearchResultsHeader';
import SearchResultsToolbar from './search/SearchResultsToolbar';
import PhraseFilters from './search/PhraseFilters';
import DiacriticFilters from './search/DiacriticFilters';
import NeighboringWords from './search/NeighboringWords';
import { copyToClipboard } from '../utils/text';

interface SearchViewProps {
  query: string;
  results: Ayah[];
  onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number) => void;
  onSearchByAyahNumber: (ayahNumber: number) => void;
  onSearchComplete: () => void;
  autoOpenDiscussion?: boolean;
  displayEditionData: SurahData[];
  searchEdition: string;
  position?: { surah: number, ayah: number, wordIndex: number };
  simpleCleanData: SurahData[];
  onSaveAyah: (item: SavedAyahItem) => void;
  onSaveSearch: (item: SavedSearchItem) => void;
  searchType?: 'text' | 'number';
  currentlyPlayingAyahGlobalNumber: number | null;
  isPlaybackLoading: boolean;
  onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
  correctedQuery?: string;
  isRootSearch?: boolean;
  targetSurahNumber?: number;
}
`;

let newContent = cleanImports + body;

// Remove the `sortedHighlightedWords` UI again carefully
const uiStart = newContent.indexOf('{sortedHighlightedWords.length > 0 && (');
if (uiStart !== -1) {
    const uiEnd = newContent.indexOf('</div>\n            )}', uiStart) + '</div>\n            )}'.length;
    newContent = newContent.substring(0, uiStart) + newContent.substring(uiEnd);
}

// Remove highlightedWordOccurrences and sortedHighlightedWords and activeFiltersList
const hStart = newContent.indexOf('const highlightedWordOccurrences = useMemo(() => {');
if (hStart !== -1) {
    const hEnd = newContent.indexOf('}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);', hStart) + '}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);'.length;
    newContent = newContent.substring(0, hStart) + newContent.substring(hEnd);
}

const sStart = newContent.indexOf('const sortedHighlightedWords = useMemo(() => {');
if (sStart !== -1) {
    const sEnd = newContent.indexOf('}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);', sStart) + '}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);'.length;
    newContent = newContent.substring(0, sStart) + newContent.substring(sEnd);
}

const aStart = newContent.indexOf('const activeFiltersList = useMemo(() => {');
if (aStart !== -1) {
    const aEnd = newContent.indexOf('setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };', aStart) + 'setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };'.length;
    newContent = newContent.substring(0, aStart) + newContent.substring(aEnd);
}

const handleCopyStart = newContent.indexOf('const handleCopyHighlightedWords = () => {');
if (handleCopyStart !== -1) {
    const handleCopyEnd = newContent.indexOf('}, 2000);\n  };', handleCopyStart) + '}, 2000);\n  };'.length;
    const newHandleCopy = `  const handleCopyHighlightedWords = () => {
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
            return \`\${w.phrase} (\${w.count} \${timesStr})\`;
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
    }, 2000);
  };`;
    newContent = newContent.substring(0, handleCopyStart) + newHandleCopy + newContent.substring(handleCopyEnd);
}

newContent = newContent.replace(/highlightedWordOccurrences\.length/g, 'phraseFilters.length');
newContent = newContent.replace(/resultsCount={results\.length}/g, 'resultsCount={displayedResults.length}');
newContent = newContent.replace(/const \[wordSortMode, setWordSortMode\] = useState<'match' \| 'frequency' \| 'quran'>\('match'\);\n/g, '');
newContent = newContent.replace(/wordSortMode, /g, '');

fs.writeFileSync('components/SearchView.tsx', newContent);
