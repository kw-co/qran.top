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

fs.writeFileSync('components/SearchView.tsx', content);
