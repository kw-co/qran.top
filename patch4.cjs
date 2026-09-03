const fs = require('fs');
let content = fs.readFileSync('hooks/useSearchLogic.ts', 'utf8');

const start = content.indexOf('const diacriticVariants = useMemo(() => {');
const end = content.indexOf('}, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData]);', start) + '}, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData, activePhraseFilter, activeMuqattaatFilter, exactMatch]);'.length;

const newCode = `    const diacriticVariants = useMemo(() => {
        if (searchType !== 'text' || queryWords.length === 0) return [];

        const variantsMap = new Map<string, number>();
        const numQueryWords = queryWords.length;
        const currentResults = applyFilters(deferredResults, { skipDiacritic: true });

        if (isRootSearch) {
            const queryWordsSet = new Set(queryWords);
            for (const ayah of currentResults) {
                const displaySurah = displayEditionData?.find((s: any) => s.number === ayah.surah?.number);
                const displayAyah = displaySurah?.ayahs.find((a: any) => a.numberInSurah === ayah.numberInSurah);
                const targetText = displayAyah?.text || ayah.text;

                const rawWords = targetText.split(/\\s+/).filter(Boolean);
                for (const rawWord of rawWords) {
                    const normWord = normalizeArabicText(rawWord);
                    if (queryWordsSet.has(normWord)) {
                        const voweledWord = rawWord.replace(/[\\u06D6-\\u06ED]/g, '');
                        variantsMap.set(voweledWord, (variantsMap.get(voweledWord) || 0) + 1);
                    }
                }
            }
        } else {
            for (const ayah of currentResults) {
                const displaySurah = displayEditionData?.find((s: any) => s.number === ayah.surah?.number);
                const displayAyah = displaySurah?.ayahs.find((a: any) => a.numberInSurah === ayah.numberInSurah);
                const targetText = displayAyah?.text || ayah.text;
                
                const rawWords = targetText.split(/\\s+/).filter(Boolean);
                const normWords = rawWords.map(w => normalizeArabicText(w));
                
                for (let i = 0; i <= normWords.length - numQueryWords; i++) {
                    let match = true;
                    for (let j = 0; j < numQueryWords; j++) {
                        // wait, previous logic used strict match, but for single word it might be substring?
                        // If it's a single word search, use substring match for highlighting
                        if (isSingleWordSearch) {
                            if (!normWords[i].includes(queryWords[0])) {
                                match = false;
                                break;
                            }
                        } else {
                            if (normWords[i + j] !== queryWords[j]) {
                                match = false;
                                break;
                            }
                        }
                    }
                    if (match) {
                        const voweledPhrase = rawWords.slice(i, i + numQueryWords).map(w => w.replace(/[\\u06D6-\\u06ED]/g, '')).join(' ');
                        variantsMap.set(voweledPhrase, (variantsMap.get(voweledPhrase) || 0) + 1);
                    }
                }
            }
        }

        return Array.from(variantsMap.entries())
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
    }, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData, activePhraseFilter, activeMuqattaatFilter, exactMatch]);`;

content = content.substring(0, start) + newCode + content.substring(content.indexOf('}, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData]);', start) + '}, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData]);'.length);
fs.writeFileSync('hooks/useSearchLogic.ts', content);
