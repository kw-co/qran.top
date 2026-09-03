const fs = require('fs');
let content = fs.readFileSync('hooks/useSearchLogic.ts', 'utf8');

// Find the start and end of phraseFilters
const startPhrase = content.indexOf('const phraseFilters = useMemo(() => {');
const endPhrase = content.indexOf('}, [deferredResults, queryWords, searchType, isRootSearch]);', startPhrase) + '}, [deferredResults, queryWords, searchType, isRootSearch]);'.length;

const newPhraseFiltersCode = `    const phraseFilters = useMemo(() => {
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
            const queryWord = queryWords[0];
            const wordMap = new Map<string, number>();
            currentResults.forEach(ayah => {
                const ayahWords = getNormalizedWords(ayah);
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
        
        const phrasesToConsider = new Set<string>();
        currentResults.forEach(ayah => {
            const ayahWords = getNormalizedWords(ayah);
            const indices = [];
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

        const allPhraseCounts = [];
        phrasesToConsider.forEach(phrase => {
            const count = currentResults.filter(ayah => getNormalizedText(ayah).includes(phrase)).length;
            allPhraseCounts.push({ phrase, count });
        });

        return allPhraseCounts.sort((a, b) => b.count - a.count).filter(item => item.count > 0);
    }, [deferredResults, queryWords, searchType, isRootSearch, activeDiacriticFilter, activeMuqattaatFilter, exactMatch]);`;

content = content.substring(0, startPhrase) + newPhraseFiltersCode + content.substring(endPhrase);
fs.writeFileSync('hooks/useSearchLogic.ts', content);
