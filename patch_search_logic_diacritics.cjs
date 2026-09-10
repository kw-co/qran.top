const fs = require('fs');
const file = './hooks/useSearchLogic.ts';
let content = fs.readFileSync(file, 'utf8');

// Add activeDiacriticFilter state
content = content.replace(
    "const [activeMuqattaatFilter, setActiveMuqattaatFilter] = useState('');",
    "const [activeMuqattaatFilter, setActiveMuqattaatFilter] = useState('');\n    const [activeDiacriticFilter, setActiveDiacriticFilter] = useState('');"
);

// Add diacriticVariants useMemo
const diacriticVariantsCode = `    const diacriticVariants = useMemo(() => {
        if (searchType !== 'text' || queryWords.length === 0 || isRootSearch) return [];

        const variantsMap = new Map<string, number>();
        const numQueryWords = queryWords.length;

        for (const ayah of deferredResults) {
            const rawWords = ayah.text.split(/\\s+/).filter(Boolean);
            const normWords = rawWords.map(w => normalizeArabicText(w));

            for (let i = 0; i <= normWords.length - numQueryWords; i++) {
                let match = true;
                for (let j = 0; j < numQueryWords; j++) {
                    if (normWords[i + j] !== queryWords[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    const voweledPhrase = rawWords.slice(i, i + numQueryWords).map(w => w.replace(/[\\u06D6-\\u06ED]/g, '')).join(' ');
                    variantsMap.set(voweledPhrase, (variantsMap.get(voweledPhrase) || 0) + 1);
                }
            }
        }

        return Array.from(variantsMap.entries())
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
    }, [deferredResults, queryWords, searchType, isRootSearch]);

    const occurrencesMap`;

content = content.replace("const occurrencesMap", diacriticVariantsCode);

// Add diacritic filtering logic
const diacriticFilterCode = `        if (activeDiacriticFilter && activeDiacriticFilter.trim() !== '') {
            const dFilters = activeDiacriticFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (dFilters.length > 0) {
                filtered = filtered.filter(ayah => {
                    const cleanAyahText = ayah.text.replace(/[\\u06D6-\\u06ED]/g, '').replace(/\\s+/g, ' ');
                    return dFilters.some(df => cleanAyahText.includes(df));
                });
            }
        }

        if (activeMuqattaatFilter`;

content = content.replace("if (activeMuqattaatFilter", diacriticFilterCode);

// Update activeResults dependencies
content = content.replace(
    "}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, isSingleWordSearch, isRootSearch]);",
    "}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, activeDiacriticFilter, isSingleWordSearch, isRootSearch]);"
);

// Reset filter on query change
content = content.replace(
    "setActivePhraseFilter('all');",
    "setActivePhraseFilter('all');\n        setActiveDiacriticFilter('');"
);

// Export new state and variants
content = content.replace(
    "activeMuqattaatFilter, setActiveMuqattaatFilter,",
    "activeMuqattaatFilter, setActiveMuqattaatFilter,\n        activeDiacriticFilter, setActiveDiacriticFilter,\n        diacriticVariants,"
);

fs.writeFileSync(file, content);
