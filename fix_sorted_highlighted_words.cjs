const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

const sStart = content.indexOf('const sortedHighlightedWords = useMemo(() => {');
if (sStart !== -1) {
    const sEndStr = '}, [highlightedWordOccurrences, queryWords, query, correctedQuery]);';
    const sEndIdx = content.indexOf(sEndStr, sStart);
    if (sEndIdx !== -1) {
        content = content.substring(0, sStart) + content.substring(sEndIdx + sEndStr.length);
    } else {
        console.log("Could not find the end string!");
    }
} else {
    console.log("Could not find the start string!");
}

fs.writeFileSync('components/SearchView.tsx', content);
