const fs = require('fs');
let content = fs.readFileSync('components/search/SearchResultsToolbar.tsx', 'utf8');

// The toolbar should have: Play All, Save Search, Copy All, Download All.
// User wants Play All back, but simple, like a play button icon with text.
// No reciter selector.
// Make toolbar wider and simpler.

content = `import React from 'react';
import type { QuranEdition } from '../../types';
import { BookmarkIcon, DocumentDuplicateIcon, DownloadIcon, CheckIcon, PlayIcon, SpinnerIcon } from '../icons';

interface SearchResultsToolbarProps {
    isPlaybackLoading: boolean;
    allAudioEditions: QuranEdition[];
    onPlayAll: () => void;
    selectedAudioEdition: string;
    onAudioEditionChange: (id: string) => void;
    searchType: 'text' | 'number';
    onSaveSearch: () => void;
    onCopyAll: () => void;
    isAllCopied: boolean;
    onCopyHighlightedWords?: () => void;
    isHighlightedCopied?: boolean;
    copyHighlightedMode?: number;
    copyHighlightedToast?: string;
    highlightedWordsCount?: number;
    onDownloadAll: () => void;
}

const SearchResultsToolbar: React.FC<SearchResultsToolbarProps> = ({
    isPlaybackLoading, allAudioEditions, onPlayAll, searchType, onSaveSearch, onCopyAll, isAllCopied,
    onDownloadAll
}) => {
    return (
        <div className="flex items-center flex-wrap gap-3 my-6 p-4 bg-surface-subtle rounded-xl border border-border-default w-full">
            <span className="text-sm font-semibold text-text-muted ml-2 shrink-0">أدوات النتائج:</span>
            
            <button 
                onClick={onPlayAll} 
                disabled={isPlaybackLoading || allAudioEditions.length === 0} 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                title="تشغيل النتائج متتالية"
            >
                {isPlaybackLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <PlayIcon className="w-5 h-5"/>}
                <span>{isPlaybackLoading ? 'تحضير...' : 'تشغيل الكل'}</span>
            </button>

            {searchType === 'text' && (
                <button onClick={onSaveSearch} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors">
                    <BookmarkIcon className="w-4 h-4"/>
                    <span>حفظ البحث</span>
                </button>
            )}

            <button onClick={onCopyAll} disabled={isAllCopied} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors disabled:opacity-70">
                {isAllCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <DocumentDuplicateIcon className="w-4 h-4"/>}
                <span>{isAllCopied ? 'تم النسخ!' : 'نسخ النتائج'}</span>
            </button>

            <button onClick={onDownloadAll} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors">
                <DownloadIcon className="w-4 h-4"/>
                <span>تحميل (txt)</span>
            </button>
        </div>
    );
};

export default React.memo(SearchResultsToolbar);
`;

fs.writeFileSync('components/search/SearchResultsToolbar.tsx', content);
