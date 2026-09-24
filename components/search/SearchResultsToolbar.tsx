import React from 'react';
import type { QuranEdition } from '../../types';
import { BookmarkIcon, DocumentDuplicateIcon, DownloadIcon, CheckIcon, PlayIcon, SpinnerIcon, ShareIcon, DhikrIcon } from '../icons';

interface SearchResultsToolbarProps {
    isPlaybackLoading: boolean;
    allAudioEditions: QuranEdition[];
    onPlayAll: () => void;
    onPlayAllAsDhikr?: () => void;
    selectedAudioEdition: string;
    onAudioEditionChange: (id: string) => void;
    searchType: 'text' | 'number';
    onSaveSearch: () => void;
    onCopyAll: () => void;
    isAllCopied: boolean;
    onShareSearch?: () => void;
    isShareCopied?: boolean;
    onCopyHighlightedWords?: () => void;
    isHighlightedCopied?: boolean;
    copyHighlightedMode?: number;
    copyHighlightedToast?: string;
    highlightedWordsCount?: number;
    onDownloadAll: () => void;
}

const SearchResultsToolbar: React.FC<SearchResultsToolbarProps> = ({
    isPlaybackLoading, allAudioEditions, onPlayAll, onPlayAllAsDhikr, searchType, onSaveSearch, onCopyAll, isAllCopied,
    onShareSearch, isShareCopied, onDownloadAll
}) => {
    return (
        <div className="flex items-center flex-wrap gap-3 my-6 p-4 bg-surface-subtle rounded-xl border border-border-default w-full">
            <span className="text-sm font-semibold text-text-muted ml-2 shrink-0">أدوات النتائج:</span>
            
            <button 
                onClick={onPlayAll} 
                disabled={isPlaybackLoading || allAudioEditions.length === 0} 
                className="flex items-center justify-center p-2 rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                title="تشغيل متتالي لآيات نتائج البحث"
            >
                {isPlaybackLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <PlayIcon className="w-5 h-5"/>}
            </button>

            {onPlayAllAsDhikr && (
                <button 
                    onClick={onPlayAllAsDhikr} 
                    disabled={isPlaybackLoading || allAudioEditions.length === 0} 
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer font-bold text-xs"
                    title="تشغيل نتائج البحث كذكر (تكرار الآيات بعدد محدد للحفظ والترديد)"
                >
                    <DhikrIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>تشغيل كذكر</span>
                </button>
            )}

            {onShareSearch && (
                <button
                    type="button"
                    onClick={onShareSearch}
                    className="flex items-center justify-center p-2 rounded-xl text-text-primary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors cursor-pointer"
                    title="مشاركة رابط البحث الحالي مع الفلاتر النشطة"
                >
                    {isShareCopied ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <ShareIcon className="w-5 h-5 text-primary" />}
                </button>
            )}

            {searchType === 'text' && (
                <button onClick={onSaveSearch} title="حفظ البحث" className="flex items-center justify-center p-2 rounded-xl text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors cursor-pointer">
                    <BookmarkIcon className="w-5 h-5"/>
                </button>
            )}

            <button onClick={onCopyAll} disabled={isAllCopied} title="نسخ النتائج" className="flex items-center justify-center p-2 rounded-xl text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors disabled:opacity-70 cursor-pointer">
                {isAllCopied ? <CheckIcon className="w-5 h-5 text-green-500"/> : <DocumentDuplicateIcon className="w-5 h-5"/>}
            </button>

            <button onClick={onDownloadAll} title="تحميل (txt)" className="flex items-center justify-center p-2 rounded-xl text-text-secondary bg-surface hover:bg-surface-hover border border-border-default shadow-sm transition-colors cursor-pointer">
                <DownloadIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

export default React.memo(SearchResultsToolbar);
