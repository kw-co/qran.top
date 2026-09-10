const fs = require('fs');
const file = './components/SearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "targetMuqattaat?: string;",
    "" // removed from props
);
content = content.replace(
    "correctedQuery, isRootSearch = false, targetSurahNumber, targetMuqattaat",
    "correctedQuery, isRootSearch = false, targetSurahNumber"
);

fs.writeFileSync(file, content);
