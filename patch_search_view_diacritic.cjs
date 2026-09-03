const fs = require('fs');
const file = './components/SearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import DiacriticFilters
content = content.replace(
    "import PhraseFilters from './search/PhraseFilters';",
    "import PhraseFilters from './search/PhraseFilters';\nimport DiacriticFilters from './search/DiacriticFilters';"
);

// Destructure new states from useSearchLogic
content = content.replace(
    "activeMuqattaatFilter, setActiveMuqattaatFilter,",
    "activeMuqattaatFilter, setActiveMuqattaatFilter, activeDiacriticFilter, setActiveDiacriticFilter, diacriticVariants,"
);

// Insert DiacriticFilters before PhraseFilters
content = content.replace(
    "<PhraseFilters phraseFilters={phraseFilters}",
    "<DiacriticFilters variants={diacriticVariants} activeFilter={activeDiacriticFilter} setActiveFilter={setActiveDiacriticFilter} resultsCount={results.length} />\n        <PhraseFilters phraseFilters={phraseFilters}"
);

fs.writeFileSync(file, content);
