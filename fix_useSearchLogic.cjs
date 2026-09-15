const fs = require('fs');
const file = 'hooks/useSearchLogic.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    /\}, \[query, correctedQuery, isRootSearch, initialFilters\]\);/g,
    "}, [query, correctedQuery, isRootSearch]);"
);
fs.writeFileSync(file, content);
