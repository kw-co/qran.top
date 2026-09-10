const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('targetMuqattaat?: string;')) {
    content = content.replace(
        "targetSurahNumber?: number;",
        "targetSurahNumber?: number;\n    targetMuqattaat?: string;"
    );

    content = content.replace(
        "searchType, query, correctedQuery, targetSurahNumber, displayedResultsCount, resultsCount,",
        "searchType, query, correctedQuery, targetSurahNumber, targetMuqattaat, displayedResultsCount, resultsCount,"
    );

    const replacement = `{targetSurahNumber && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    في {QURAN_INDEX[targetSurahNumber - 1]?.name}
                                </span>
                            )}
                            {targetMuqattaat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {targetMuqattaat}
                                </span>
                            )}`;
                            
    content = content.replace(
        /\{targetSurahNumber && \([\s\S]*?\}\)/,
        replacement
    );
}

fs.writeFileSync(file, content);
