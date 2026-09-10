const fs = require('fs');
const file = './components/SearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('targetMuqattaat?: string;')) {
    content = content.replace(
        "targetSurahNumber?: number;\n}",
        "targetSurahNumber?: number;\n  targetMuqattaat?: string;\n}"
    );

    content = content.replace(
        "correctedQuery, isRootSearch = false, targetSurahNumber",
        "correctedQuery, isRootSearch = false, targetSurahNumber, targetMuqattaat"
    );

    content = content.replace(
        "searchType={searchType} query={query} correctedQuery={correctedQuery} targetSurahNumber={targetSurahNumber}",
        "searchType={searchType} query={query} correctedQuery={correctedQuery} targetSurahNumber={targetSurahNumber} targetMuqattaat={targetMuqattaat}"
    );
}

fs.writeFileSync(file, content);
