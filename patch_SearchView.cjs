const fs = require('fs');
const file = './components/SearchView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('showMuqattaatInSearch={showMuqattaatInSearch}')) {
    content = content.replace(
        "const { displayEdition, fontStyle, selectedAudioEdition, setSelectedAudioEdition, activeEditions, fontSize, copyTextFormat, copyCitationFormat } = useSettingsContext();",
        "const { displayEdition, fontStyle, selectedAudioEdition, setSelectedAudioEdition, activeEditions, fontSize, copyTextFormat, copyCitationFormat, showMuqattaatInSearch } = useSettingsContext();"
    );

    content = content.replace(
        "searchType={searchType} query={query} correctedQuery={correctedQuery} targetSurahNumber={targetSurahNumber}",
        "searchType={searchType} query={query} correctedQuery={correctedQuery} targetSurahNumber={targetSurahNumber} showMuqattaatInSearch={showMuqattaatInSearch}"
    );
}

fs.writeFileSync(file, content);
