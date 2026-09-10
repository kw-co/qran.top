const fs = require('fs');
let content = fs.readFileSync('components/search/SearchResultsToolbar.tsx', 'utf8');

// The block to remove:
/*
            <div className="flex flex-wrap items-center gap-2 border border-border-default rounded-2xl sm:rounded-full bg-surface p-1 shadow-sm max-w-full">
                <button onClick={onPlayAll} disabled={isPlaybackLoading || allAudioEditions.length === 0} className="flex items-center gap-2 px-3 py-1 rounded-full text-sm text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPlaybackLoading ? <SpinnerIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                    <span>{isPlaybackLoading ? 'تحضير...' : 'تشغيل الكل'}</span>
                </button>
                <div className="border-l border-border-default h-5"></div>
                <div className="min-w-0">
                    <AudioEditionSelector 
                        audioEditions={allAudioEditions}
                        selectedAudioEdition={selectedAudioEdition}
                        onSelect={onAudioEditionChange}
                        size="sm"
                    />
                </div>
            </div>
*/

const startIdx = content.indexOf('<div className="flex flex-wrap items-center gap-2 border border-border-default');
if (startIdx !== -1) {
    // Find the end of this div block
    const endStr = '</div>\n            </div>';
    const endIdx = content.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx + endStr.length);
    }
}

// Clean up unused imports if needed (PlayIcon, SpinnerIcon, AudioEditionSelector)
content = content.replace('PlayIcon, SpinnerIcon, BookmarkIcon, DocumentDuplicateIcon, DownloadIcon, CheckIcon', 'BookmarkIcon, DocumentDuplicateIcon, DownloadIcon, CheckIcon');
content = content.replace("import AudioEditionSelector from '../AudioEditionSelector';\n", '');

fs.writeFileSync('components/search/SearchResultsToolbar.tsx', content);
