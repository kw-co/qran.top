const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

// The file has garbage lines like `lue, useCallback } from 'react';` injected multiple times.
content = content.replace(/.*lue, useCallback } from 'react';\n/g, '');
content = content.replace(/.*import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '\.\.\/types';\n/g, '');
content = content.replace(/.*import { SearchIcon, ClearIcon, DocumentDuplicateIcon } from '\.\/icons';\n/g, '');
content = content.replace(/.*import { normalizeArabicText, formatSurahNameForDisplay, formatAyahForCopy } from '\.\.\/utils\/text';\n/g, '');
content = content.replace(/.*import { useSearchLogic } from '\.\.\/hooks\/useSearchLogic';\n/g, '');
content = content.replace(/.*import { useSettingsContext } from '\.\.\/contexts\/SettingsContext';\n/g, '');
content = content.replace(/.*import { ALL_AUDIO_EDITIONS } from '\.\.\/data\/audioEditions';\n/g, '');
content = content.replace(/.*import AyahActionPopover from '\.\/AyahActionPopover';\n/g, '');
content = content.replace(/.*import SearchResultItem from '\.\/SearchResultItem';\n/g, '');
content = content.replace(/.*import SearchResultsHeader from '\.\/search\/SearchResultsHeader';\n/g, '');
content = content.replace(/.*import SearchResultsToolbar from '\.\/search\/SearchResultsToolbar';\n/g, '');
content = content.replace(/.*import PhraseFilters from '\.\/search\/PhraseFilters';\n/g, '');
content = content.replace(/.*import DiacriticFilters from '\.\/search\/DiacriticFilters';\n/g, '');
content = content.replace(/.*import NeighboringWords from '\.\/search\/NeighboringWords';\n/g, '');
content = content.replace(/.*import { copyToClipboard } from '\.\.\/utils\/text';\n/g, '');

const cleanImports = `import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, ClearIcon, DocumentDuplicateIcon } from './icons';
import { normalizeArabicText, formatSurahNameForDisplay, formatAyahForCopy, copyToClipboard } from '../utils/text';
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
`;

fs.writeFileSync('components/SearchView.tsx', cleanImports + content);
