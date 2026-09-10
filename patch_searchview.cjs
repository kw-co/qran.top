const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

// 1. Remove highlightedWordOccurrences calculation
const highlightedStart = content.indexOf('const highlightedWordOccurrences = useMemo(() => {');
const highlightedEnd = content.indexOf('}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);', highlightedStart) + '}, [deferredResults, displayEditionData, queryWords, searchType, fontStyle]);'.length;
content = content.substring(0, highlightedStart) + content.substring(highlightedEnd);

// 2. Remove sortedHighlightedWords calculation
const sortedStart = content.indexOf('const sortedHighlightedWords = useMemo(() => {');
const sortedEnd = content.indexOf('}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);', sortedStart) + '}, [highlightedWordOccurrences, correctedQuery, query, queryWords]);'.length;
content = content.substring(0, sortedStart) + content.substring(sortedEnd);

// 3. Remove activeFiltersList and handleToggleWordFilter which was used by sortedHighlightedWords
const handleToggleStart = content.indexOf('const activeFiltersList = useMemo(() => {');
const handleToggleEnd = content.indexOf('setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };', handleToggleStart) + 'setActivePhraseFilter(nextFilters.join(\',\'));\n    }\n  };'.length;
content = content.substring(0, handleToggleStart) + content.substring(handleToggleEnd);

// 4. Remove the UI rendering for sortedHighlightedWords
const uiStart = content.indexOf('{/* Header Row */}');
const uiContainerStart = content.lastIndexOf('<div className="my-4 p-3.5 sm:p-4 bg-surface-subtle', uiStart);
const uiEnd = content.indexOf('</div>\n            )}', uiContainerStart) + '</div>\n            )}'.length;

// Wait, it's inside a {results.length > 0 && ( <> ... </> )} block
// Let's replace it safely with regex or accurate indexing
