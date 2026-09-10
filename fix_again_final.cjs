const fs = require('fs');
let imports = fs.readFileSync('components/SearchView.tsx.imports', 'utf8');
let body = fs.readFileSync('components/SearchView.tsx.clean', 'utf8');

imports = imports.replace(/^t\';/, "import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react';\n");
if (!imports.includes('copyToClipboard')) {
    imports = imports.replace(/formatAyahForCopy } from '\.\.\/utils\/text';/, "formatAyahForCopy, copyToClipboard } from '../utils/text';");
}

let newContent = imports + body;

// Remove the `sortedHighlightedWords` UI again carefully
const uiStart = newContent.indexOf('{sortedHighlightedWords.length > 0 && (');
if (uiStart !== -1) {
    const uiEnd = newContent.indexOf('</div>\n            )}', uiStart) + '</div>\n            )}'.length;
    newContent = newContent.substring(0, uiStart) + newContent.substring(uiEnd);
}

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
    const handleCopyEnd = newContent.indexOf('});\n  };', handleCopyStart) + '});\n  };'.length;
    
    if (newContent.indexOf('});\n  };', handleCopyStart) !== -1) {
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
    }, 2500);
  };`;
        newContent = newContent.substring(0, handleCopyStart) + newHandleCopy + newContent.substring(handleCopyEnd);
    }
}

newContent = newContent.replace(/highlightedWordOccurrences\.length/g, 'phraseFilters.length');
newContent = newContent.replace(/resultsCount={results\.length}/g, 'resultsCount={displayedResults.length}');
newContent = newContent.replace(/const \[wordSortMode, setWordSortMode\] = useState<'match' \| 'frequency' \| 'quran'>\('match'\);\n/g, '');
newContent = newContent.replace(/wordSortMode, /g, '');

fs.writeFileSync('components/SearchView.tsx', newContent);
