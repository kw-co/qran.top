const fs = require('fs');
const file = './components/SearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('activeMuqattaatFilter, setActiveMuqattaatFilter')) {
    content = content.replace(
        "activePhraseFilter, setActivePhraseFilter,",
        "activePhraseFilter, setActivePhraseFilter, activeMuqattaatFilter, setActiveMuqattaatFilter,"
    );
    
    // Also pass them to SearchResultsHeader, and pass baseResults={results}
    content = content.replace(
        "targetMuqattaat={targetMuqattaat} showMuqattaatInSearch={showMuqattaatInSearch}",
        "activeMuqattaatFilter={activeMuqattaatFilter} setActiveMuqattaatFilter={setActiveMuqattaatFilter} showMuqattaatInSearch={showMuqattaatInSearch} baseResults={results}"
    );
}

fs.writeFileSync(file, content);
