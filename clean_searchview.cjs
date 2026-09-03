const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

const hStart = content.indexOf('const highlightedWordOccurrences = useMemo(() => {');
const hEnd = content.indexOf('}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);', hStart) + '}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);'.length;
content = content.substring(0, hStart) + content.substring(hEnd);

const sStart = content.indexOf('const sortedHighlightedWords = useMemo(() => {');
const sEnd = content.indexOf('}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);', sStart) + '}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);'.length;
content = content.substring(0, sStart) + content.substring(sEnd);

const aStart = content.indexOf('const activeFiltersList = useMemo(() => {');
const aEnd = content.indexOf('setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };', aStart) + 'setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };'.length;
content = content.substring(0, aStart) + content.substring(aEnd);

const uiStart = content.indexOf('{sortedHighlightedWords.length > 0 && (');
const uiEnd = content.indexOf('</div>\n            )}', uiStart) + '</div>\n            )}'.length;
content = content.substring(0, uiStart) + content.substring(uiEnd);

const handleCopyStart = content.indexOf('const handleCopyHighlightedWords = () => {');
const handleCopyEnd = content.indexOf('}, 2000);\n  };', handleCopyStart) + '}, 2000);\n  };'.length;

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

    // fallback copyToClipboard from utils? Or just standard navigator.clipboard
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

content = content.substring(0, handleCopyStart) + newHandleCopy + content.substring(handleCopyEnd);

content = content.replace(/highlightedWordOccurrences\.length/g, 'phraseFilters.length');
content = content.replace(/resultsCount={results\.length}/g, 'resultsCount={displayedResults.length}');
// Ensure we remove wordSortMode state since we removed its UI
content = content.replace(/const \[wordSortMode, setWordSortMode\] = useState<'match' \| 'frequency' \| 'quran'>\('match'\);\n/g, '');
// Remove wordSortMode from dependency arrays
content = content.replace(/wordSortMode, /g, '');

fs.writeFileSync('components/SearchView.tsx', content);
