const fs = require('fs');
const file = './hooks/useSearch.ts';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('SURAH_MUQATTAAT_MAP')) {
    content = content.replace(
        "import { QURAN_INDEX } from '../quranIndex';",
        "import { QURAN_INDEX } from '../quranIndex';\nconst SURAH_MUQATTAAT_MAP: Record<number, string> = {\n    2: \"الم\", 3: \"الم\", 7: \"المص\", 10: \"الر\", 11: \"الر\", 12: \"الر\", 13: \"المر\", 14: \"الر\", 15: \"الر\",\n    19: \"كهيعص\", 20: \"طه\", 26: \"طسم\", 27: \"طس\", 28: \"طسم\", 29: \"الم\", 30: \"الم\", 31: \"الم\", 32: \"الم\",\n    36: \"يس\", 38: \"ص\", 40: \"حم\", 41: \"حم\", 42: \"حم عسق\", 43: \"حم\", 44: \"حم\", 45: \"حم\", 46: \"حم\",\n    50: \"ق\", 68: \"ن\"\n};"
    );
}

// Update performSearch signature
content = content.replace(
    "performSearch = useCallback((query: string, isRootSearch?: boolean, overrideTargetSurah?: number): { results: Ayah[], finalSearchEdition: string, correctedQuery?: string, targetSurahNumber?: number, parsedQuery?: string } => {",
    "performSearch = useCallback((query: string, isRootSearch?: boolean, overrideTargetSurah?: number, targetMuqattaat?: string): { results: Ayah[], finalSearchEdition: string, correctedQuery?: string, targetSurahNumber?: number, targetMuqattaat?: string, parsedQuery?: string } => {"
);

content = content.replace(
    "if (!allQuranData) return { results: [], finalSearchEdition: 'quran-simple-clean', targetSurahNumber: undefined, parsedQuery: undefined };",
    "if (!allQuranData) return { results: [], finalSearchEdition: 'quran-simple-clean', targetSurahNumber: undefined, targetMuqattaat: undefined, parsedQuery: undefined };"
);

content = content.replace(
    "return { results: [], finalSearchEdition: 'quran-simple-clean', targetSurahNumber: undefined, parsedQuery: undefined };",
    "return { results: [], finalSearchEdition: 'quran-simple-clean', targetSurahNumber: undefined, targetMuqattaat: undefined, parsedQuery: undefined };"
);

content = content.replace(
    "targetSurahNumber: targetSurahNumber || undefined,\n                parsedQuery: finalQuery",
    "targetSurahNumber: targetSurahNumber || undefined,\n                targetMuqattaat: targetMuqattaat || undefined,\n                parsedQuery: finalQuery"
);

// Apply filter for targetMuqattaat in root search
content = content.replace(
    "if (targetSurahNumber) {\n                results = results.filter(ayah => ayah.surah.number === targetSurahNumber);\n            }",
    "if (targetSurahNumber) {\n                results = results.filter(ayah => ayah.surah.number === targetSurahNumber);\n            }\n            if (targetMuqattaat) {\n                results = results.filter(ayah => SURAH_MUQATTAAT_MAP[ayah.surah.number] === targetMuqattaat);\n            }"
);

// Apply filter in normal search
content = content.replace(
    "if (targetSurahNumber) {\n            resultObj.results = resultObj.results.filter(ayah => ayah.surah.number === targetSurahNumber);\n            return { ...resultObj, targetSurahNumber: targetSurahNumber || undefined, parsedQuery: finalQuery };\n        }",
    "if (targetSurahNumber) {\n            resultObj.results = resultObj.results.filter(ayah => ayah.surah.number === targetSurahNumber);\n        }\n        if (targetMuqattaat) {\n            resultObj.results = resultObj.results.filter(ayah => SURAH_MUQATTAAT_MAP[ayah.surah.number] === targetMuqattaat);\n        }\n        if (targetSurahNumber || targetMuqattaat) {\n            return { ...resultObj, targetSurahNumber: targetSurahNumber || undefined, targetMuqattaat: targetMuqattaat || undefined, parsedQuery: finalQuery };\n        }"
);

content = content.replace(
    "return { ...resultObj, targetSurahNumber: undefined, parsedQuery: finalQuery };",
    "return { ...resultObj, targetSurahNumber: undefined, targetMuqattaat: undefined, parsedQuery: finalQuery };"
);

fs.writeFileSync(file, content);
