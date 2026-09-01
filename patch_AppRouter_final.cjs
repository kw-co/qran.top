const fs = require('fs');
const file = './components/AppRouter.tsx';
let content = fs.readFileSync(file, 'utf8');

// We can just keep passing targetMuqattaat in performSearch but it returns undefined, so we can clean it up
content = content.replace(
    "const targetMuqattaatVal = isSearchPage && queryParams.has('tm') ? queryParams.get('tm')! : undefined;",
    ""
);

content = content.replace(
    "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal, targetMuqattaatVal);",
    "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal);"
);

content = content.replace(
    "}, [performSearch, isSearchPage, isSearchNumber, searchQueryVal, isRootSearchVal, targetSurahNumberVal, targetMuqattaatVal]);",
    "}, [performSearch, isSearchPage, isSearchNumber, searchQueryVal, isRootSearchVal, targetSurahNumberVal]);"
);

content = content.replace(
    "position={position} isRootSearch={isRootSearch} targetSurahNumber={searchTextResult.targetSurahNumber} targetMuqattaat={searchTextResult.targetMuqattaat} />;",
    "position={position} isRootSearch={isRootSearch} targetSurahNumber={searchTextResult.targetSurahNumber} />;"
);

fs.writeFileSync(file, content);
