const fs = require('fs');
const file = './hooks/useSearch.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove the filter for targetMuqattaat in root search
content = content.replace(
    "if (targetSurahNumber) {\n                results = results.filter(ayah => ayah.surah.number === targetSurahNumber);\n            }\n            if (targetMuqattaat) {\n                results = results.filter(ayah => SURAH_MUQATTAAT_MAP[ayah.surah.number] === targetMuqattaat);\n            }",
    "if (targetSurahNumber) {\n                results = results.filter(ayah => ayah.surah.number === targetSurahNumber);\n            }"
);

// Remove the filter for targetMuqattaat in normal search
content = content.replace(
    "if (targetSurahNumber) {\n            resultObj.results = resultObj.results.filter(ayah => ayah.surah.number === targetSurahNumber);\n        }\n        if (targetMuqattaat) {\n            resultObj.results = resultObj.results.filter(ayah => SURAH_MUQATTAAT_MAP[ayah.surah.number] === targetMuqattaat);\n        }",
    "if (targetSurahNumber) {\n            resultObj.results = resultObj.results.filter(ayah => ayah.surah.number === targetSurahNumber);\n        }"
);

fs.writeFileSync(file, content);
