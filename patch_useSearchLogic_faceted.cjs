const fs = require('fs');

let content = fs.readFileSync('hooks/useSearchLogic.ts', 'utf8');

// 1. We need a helper to filter results based on specific filters.
const applyFiltersCode = `
    // --- FACETED SEARCH FILTERING HELPER ---
    const applyFilters = (
        results: Ayah[],
        options: { skipPhrase?: boolean; skipDiacritic?: boolean; skipMuqattaat?: boolean } = {}
    ) => {
        let baseResults = results;
        
        // Exact match applies to Text Mode only (base text filtering)
        if (searchType === 'text' && exactMatch && isSingleWordSearch && !isRootSearch) {
            const normalizedQuery = queryWords.join(' ');
            const regex = new RegExp(\`(^|\\\\s)\${normalizedQuery}(\\\\s|$)\`);
            baseResults = baseResults.filter(ayah => regex.test(getNormalizedText(ayah)));
        }
        
        let filtered = baseResults;

        // Apply Diacritic Filter
        if (!options.skipDiacritic && activeDiacriticFilter && activeDiacriticFilter.trim() !== '') {
            const dFilters = activeDiacriticFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (dFilters.length > 0) {
                filtered = filtered.filter(ayah => {
                    const displaySurah = displayEditionData?.find((s: any) => s.number === ayah.surah?.number);
                    const displayAyah = displaySurah?.ayahs.find((a: any) => a.numberInSurah === ayah.numberInSurah);
                    const targetText = displayAyah?.text || ayah.text;
                    const cleanAyahText = targetText.replace(/[\\u06D6-\\u06ED]/g, '').replace(/\\s+/g, ' ');
                    return dFilters.some(df => {
                        const regex = new RegExp(\`(^|\\\\s)\${df}(\\\\s|$)\`);
                        return regex.test(cleanAyahText);
                    });
                });
            }
        }

        // Apply Muqattaat Filter
        if (!options.skipMuqattaat && activeMuqattaatFilter && activeMuqattaatFilter.trim() !== '') {
            const mFilters = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (mFilters.length > 0) {
                filtered = filtered.filter(ayah => {
                    const ayahMuqattaat = SURAH_MUQATTAAT_MAP[ayah.surah?.number || 0];
                    return mFilters.includes(ayahMuqattaat);
                });
            }
        }

        // Apply Phrase Filter (which now includes single word highlights)
        if (!options.skipPhrase && activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '') {
            const filters = activePhraseFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (filters.length > 0) {
                if (isRootSearch) {
                    filtered = filtered.filter(ayah => {
                        const ayahWords = getNormalizedWords(ayah);
                        return filters.some(f => ayahWords.includes(f));
                    });
                } else if (isSingleWordSearch) {
                    // For single word non-root search, the phrase filter might be a substring match (like highlighted words)
                    filtered = filtered.filter(ayah => {
                        const ayahWords = getNormalizedWords(ayah);
                        return filters.some(f => ayahWords.some(w => w.includes(f) || f.includes(w)));
                    });
                } else {
                    filtered = filtered.filter(ayah => {
                        const normalizedText = getNormalizedText(ayah);
                        return filters.some(f => normalizedText.includes(f));
                    });
                }
            }
        }

        return filtered;
    };
`;

// Insert it before phraseFilters
content = content.replace(
    "const phraseFilters = useMemo(() => {",
    applyFiltersCode + "\n    const phraseFilters = useMemo(() => {"
);

// Now, update phraseFilters to use applyFilters with skipPhrase: true
content = content.replace(
    "const currentResults = deferredResults;",
    "const currentResults = applyFilters(deferredResults, { skipPhrase: true });"
);
content = content.replace(
    "const count = deferredResults.filter(ayah => {",
    "const count = applyFilters(deferredResults, { skipPhrase: true }).filter(ayah => {"
);

// We need to rewrite `phraseFilters` entirely to support both root search, single word search (replacing highlighted words), and multi-word.
const newPhraseFiltersCode = `
    const phraseFilters = useMemo(() => {
        if (searchType === 'number' || queryWords.length === 0) {
            return [];
        }
        
        const currentResults = applyFilters(deferredResults, { skipPhrase: true });

        if (isRootSearch) {
            const uniqueWords = Array.from(new Set(queryWords));
            const wordCounts: { phrase: string; count: number }[] = [];
            
            uniqueWords.forEach(word => {
                const count = currentResults.filter(ayah => {
                    const ayahWords = getNormalizedWords(ayah);
                    return ayahWords.includes(word);
                }).length;
                if (count > 0) {
                    wordCounts.push({ phrase: word, count });
                }
            });
            
            wordCounts.sort((a, b) => b.count - a.count);
            return wordCounts;
        }
        
        if (isSingleWordSearch) {
            // For single word non-root search, extract words that contain the query word
            const queryWord = queryWords[0];
            const wordMap = new Map<string, number>();
            currentResults.forEach(ayah => {
                const ayahWords = getNormalizedWords(ayah);
                // We want unique matching words per ayah to count Ayahs, or just count occurrences?
                // Let's count ayahs.
                const matchedInAyah = new Set<string>();
                ayahWords.forEach(word => {
                    if (word.includes(queryWord)) {
                        matchedInAyah.add(word);
                    }
                });
                matchedInAyah.forEach(word => {
                    wordMap.set(word, (wordMap.get(word) || 0) + 1);
                });
            });
            const wordCounts = Array.from(wordMap.entries()).map(([phrase, count]) => ({ phrase, count }));
            wordCounts.sort((a, b) => b.count - a.count);
            return wordCounts;
        }
        
        // Multi-word search
        const phrasesToConsider = new Set<string>();
        currentResults.forEach(ayah => {
            const ayahWords = getNormalizedWords(ayah);
            const indices: number[] = [];
            ayahWords.forEach((word, index) => {
                if (queryWords.includes(word)) {
                    indices.push(index);
                }
            });
            
            if (indices.length >= queryWords.length) {
                const minIndex = Math.min(...indices);
                const maxIndex = Math.max(...indices);
                if (maxIndex - minIndex < queryWords.length + 3) {
                    const phrase = ayahWords.slice(minIndex, maxIndex + 1).join(' ');
                    phrasesToConsider.add(phrase);
                }
            }
        });

        const userQueryPhrase = queryWords.join(' ');
        phrasesToConsider.add(userQueryPhrase);

        const allPhraseCounts: { phrase: string, count: number }[] = [];
        phrasesToConsider.forEach(phrase => {
            const count = currentResults.filter(ayah => getNormalizedText(ayah).includes(phrase)).length;
            allPhraseCounts.push({ phrase, count });
        });

        return allPhraseCounts.sort((a, b) => b.count - a.count).filter(item => item.count > 0);
    }, [deferredResults, queryWords, searchType, isRootSearch, activeDiacriticFilter, activeMuqattaatFilter, exactMatch]);
`;

content = content.replace(
    /const phraseFilters = useMemo\(\(\) => \{[\s\S]*?return allPhraseCounts\.sort\(\(a, b\) => b\.count - a\.count\);\n    \}, \[deferredResults, queryWords, isRootSearch, searchType\]\);/g,
    newPhraseFiltersCode
);

// We need to do a regex replace because the dependencies list might be different.
content = content.replace(
    /const phraseFilters = useMemo\(\(\) => \{[\s\S]*?return allPhraseCounts\.sort[\s\S]*?\}\, \[.*?\]\);/g,
    newPhraseFiltersCode
);

fs.writeFileSync('hooks/useSearchLogic.ts', content);
