const fs = require('fs');
let imports = fs.readFileSync('components/SearchView.tsx.imports', 'utf8');
let body = fs.readFileSync('components/SearchView.tsx.clean', 'utf8');

imports = imports.replace(/^t\';/, "import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from 'react';\n");
if (!imports.includes('copyToClipboard')) {
    imports = imports.replace(/formatAyahForCopy } from '\.\.\/utils\/text';/, "formatAyahForCopy, copyToClipboard } from '../utils/text';");
}

let newContent = imports + body;

const uiStart = newContent.indexOf('{sortedHighlightedWords.length > 0 && (');
if (uiStart !== -1) {
    const uiEndStr = '</div>\n            )}';
    const uiEndIdx = newContent.indexOf(uiEndStr, uiStart);
    if (uiEndIdx !== -1) {
        newContent = newContent.substring(0, uiStart) + newContent.substring(uiEndIdx + uiEndStr.length);
    }
}

const hStart = newContent.indexOf('const highlightedWordOccurrences = useMemo(() => {');
if (hStart !== -1) {
    const hEndStr = '}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);';
    const hEndIdx = newContent.indexOf(hEndStr, hStart);
    if (hEndIdx !== -1) {
        newContent = newContent.substring(0, hStart) + newContent.substring(hEndIdx + hEndStr.length);
    }
}

const sStart = newContent.indexOf('const sortedHighlightedWords = useMemo(() => {');
if (sStart !== -1) {
    const sEndStr = '}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);';
    const sEndIdx = newContent.indexOf(sEndStr, sStart);
    if (sEndIdx !== -1) {
        newContent = newContent.substring(0, sStart) + newContent.substring(sEndIdx + sEndStr.length);
    }
}

const aStart = newContent.indexOf('const activeFiltersList = useMemo(() => {');
if (aStart !== -1) {
    const aEndStr = 'setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };';
    const aEndIdx = newContent.indexOf(aEndStr, aStart);
    if (aEndIdx !== -1) {
        newContent = newContent.substring(0, aStart) + newContent.substring(aEndIdx + aEndStr.length);
    }
}

const handleCopyStart = newContent.indexOf('const handleCopyHighlightedWords = () => {');
if (handleCopyStart !== -1) {
    const handleCopyEndStr = '});\n  };';
    const handleCopyEndIdx = newContent.indexOf(handleCopyEndStr, handleCopyStart);
    
    if (handleCopyEndIdx !== -1) {
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
        newContent = newContent.substring(0, handleCopyStart) + newHandleCopy + newContent.substring(handleCopyEndIdx + handleCopyEndStr.length);
    }
}

newContent = newContent.replace(/highlightedWordOccurrences\.length/g, 'phraseFilters.length');
newContent = newContent.replace(/resultsCount={results\.length}/g, 'resultsCount={displayedResults.length}');
newContent = newContent.replace(/const \[wordSortMode, setWordSortMode\] = useState\<'match' \| 'frequency' \| 'quran'\>\('match'\);\n/g, '');
newContent = newContent.replace(/wordSortMode, /g, '');

fs.writeFileSync('components/SearchView.tsx', newContent);
