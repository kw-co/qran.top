const fs = require('fs');
const file = './components/AppRouter.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('targetMuqattaatVal')) {
    content = content.replace(
        "const targetSurahNumberVal = isSearchPage && queryParams.has('ts') ? parseInt(queryParams.get('ts')!) : undefined;",
        "const targetSurahNumberVal = isSearchPage && queryParams.has('ts') ? parseInt(queryParams.get('ts')!) : undefined;\n    const targetMuqattaatVal = isSearchPage && queryParams.has('tm') ? queryParams.get('tm')! : undefined;"
    );

    content = content.replace(
        "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal);",
        "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal, targetMuqattaatVal);"
    );

    content = content.replace(
        "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal);",
        "return performSearch(searchQueryVal, isRootSearchVal, targetSurahNumberVal, targetMuqattaatVal);"
    );
    
    content = content.replace(
        "}, [performSearch, isSearchPage, isSearchNumber, searchQueryVal, isRootSearchVal, targetSurahNumberVal]);",
        "}, [performSearch, isSearchPage, isSearchNumber, searchQueryVal, isRootSearchVal, targetSurahNumberVal, targetMuqattaatVal]);"
    );
    
    content = content.replace(
        "position={position} isRootSearch={isRootSearch} targetSurahNumber={searchTextResult.targetSurahNumber} />;",
        "position={position} isRootSearch={isRootSearch} targetSurahNumber={searchTextResult.targetSurahNumber} targetMuqattaat={searchTextResult.targetMuqattaat} />;"
    );
}

fs.writeFileSync(file, content);
