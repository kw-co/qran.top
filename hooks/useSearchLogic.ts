// FIX: Import useEffect from 'react' to resolve 'Cannot find name' error.
import { useState, useMemo, useCallback, useEffect, useDeferredValue } from 'react';
import type { Ayah } from '../types';
import { normalizeArabicText, formatSurahNameForDisplay } from '../utils/text';
import { safeLocalStorage } from '../utils/storage';
const SURAH_MUQATTAAT_MAP: Record<number, string> = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر", 15: "الر",
    19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم", 31: "الم", 32: "الم",
    36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم", 44: "حم", 45: "حم", 46: "حم",
    50: "ق", 68: "ن"
};


const EXPORT_TEMPLATE_KEY = 'qran_app_export_template';
const DEFAULT_EXPORT_TEMPLATE = `ملخص البحث عن: "{{query}}"
- عدد الآيات المطابقة: {{ayah_count}}
- إجمالي التكرارات: {{general_occurrences}}
- المطابقات التامة: {{exact_occurrences}}
- خيار التطابق: {{exact_match_status}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})

---

{{/results}}
`;

// Helper to get normalized text with lazy caching to avoid heavy regex overhead
const getNormalizedText = (ayah: any): string => {
    if (ayah.normalizedText !== undefined) return ayah.normalizedText;
    if (ayah._normalizedText === undefined) {
        ayah._normalizedText = normalizeArabicText(ayah.text);
    }
    return ayah._normalizedText;
};

const getNormalizedWords = (ayah: any): string[] => {
    if (ayah._normalizedWords === undefined) {
        ayah._normalizedWords = getNormalizedText(ayah).split(/\s+/).filter(Boolean);
    }
    return ayah._normalizedWords;
};

const findNeighboringWords = (results: Ayah[], query: string): string[] => {
    const normalizedQueryWords = normalizeArabicText(query).trim().split(' ').filter(w => w.length > 0);
    const numQueryWords = normalizedQueryWords.length;

    if (numQueryWords === 0 || numQueryWords > 6) {
        return [];
    }

    const freq: { [key: string]: number } = {};
    const addNeighbor = (neighbor: string) => {
        if (neighbor && neighbor.length > 1 && !normalizedQueryWords.includes(neighbor)) {
            freq[neighbor] = (freq[neighbor] || 0) + 1;
        }
    };

    results.forEach(ayah => {
        const ayahWords = getNormalizedWords(ayah);
        const numAyahWords = ayahWords.length;

        if (numQueryWords === 1) {
            const queryWord = normalizedQueryWords[0];
            ayahWords.forEach((word, index) => {
                if (word === queryWord) {
                    if (index > 0) addNeighbor(ayahWords[index - 1]);
                    if (index < numAyahWords - 1) addNeighbor(ayahWords[index + 1]);
                }
            });
        } else {
            for (let i = 0; i <= numAyahWords - numQueryWords; i++) {
                let match = true;
                for (let j = 0; j < numQueryWords; j++) {
                    if (ayahWords[i + j] !== normalizedQueryWords[j]) {
                        match = false;
                        break;
                    }
                }
                if (match && i + numQueryWords < numAyahWords) {
                    addNeighbor(ayahWords[i + numQueryWords]);
                }
            }
        }
    });

    return Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30)
        .map(([word]) => word);
};

const getAyahMatchTier = (ayah: Ayah, queryWords: string[]): number => {
    if (!queryWords || queryWords.length === 0) return 0;
    const words = getNormalizedWords(ayah);
    if (words.length === 0) return 2;
    
    const fullQuery = queryWords.join(' ');
    
    // Tier 0: Exact word match in the ayah
    const hasExactWord = words.some(w => w === fullQuery || queryWords.includes(w));
    if (hasExactWord) return 0;

    // Tier 1: Match at the start of a word (word begins with search query word)
    const hasStartsWith = words.some(w => queryWords.some(q => q && w.startsWith(q)));
    if (hasStartsWith) return 1;

    // Tier 2: Match in the middle or end of a word
    return 2;
};


export const useSearchLogic = (
    query: string, 
    correctedQuery: string | undefined, 
    results: Ayah[], 
    searchType: 'text' | 'number',
    simpleCleanData: any[],
    isRootSearch?: boolean,
    displayEditionData?: any[]
) => {
    const [exactMatch, setExactMatch] = useState(false);
    const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(7);
    const [activePhraseFilter, setActivePhraseFilter] = useState('all');
    const [activeMuqattaatFilter, setActiveMuqattaatFilter] = useState('');
    const [activeDiacriticFilter, setActiveDiacriticFilter] = useState('');

    const queryWords = useMemo(() => {
        const finalQuery = correctedQuery || query;
        return finalQuery.trim().replace(/"/g, '').split(/\s+/).filter(Boolean).map(normalizeArabicText);
    }, [query, correctedQuery]);

    const isSingleWordSearch = queryWords.length === 1;

    const activeResults = results;
    const deferredResults = useDeferredValue(results);

    
    // --- FACETED SEARCH FILTERING HELPER ---
    const applyFilters = (
        results: Ayah[],
        options: { skipPhrase?: boolean; skipDiacritic?: boolean; skipMuqattaat?: boolean } = {}
    ) => {
        let baseResults = results;
        
        // Exact match applies to Text Mode only (base text filtering)
        if (searchType === 'text' && exactMatch && isSingleWordSearch && !isRootSearch) {
            const normalizedQuery = queryWords.join(' ');
            const regex = new RegExp(`(^|\\s)${normalizedQuery}(\\s|$)`);
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
                    const cleanAyahText = targetText.replace(/[\u06D6-\u06ED]/g, '').replace(/\s+/g, ' ');
                    return dFilters.some(df => {
                        const regex = new RegExp(`(^|\\s)${df}(\\s|$)`);
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
    }, [deferredResults, queryWords, searchType, isRootSearch, activeDiacriticFilter, activeMuqattaatFilter, exactMatch]);

        const displayedResults = useMemo(() => {
        let filtered = applyFilters(activeResults);
        
        if (searchType === 'text' && queryWords.length > 0) {
            filtered.sort((a, b) => {
                const tierA = getAyahMatchTier(a, queryWords);
                const tierB = getAyahMatchTier(b, queryWords);
                if (tierA !== tierB) return tierA - tierB;
                return 0; 
            });
        }
        return filtered;
    }, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, activeDiacriticFilter, isSingleWordSearch, isRootSearch, displayEditionData]);

            const diacriticVariants = useMemo(() => {
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

                const rawWords = targetText.split(/\s+/).filter(Boolean);
                for (const rawWord of rawWords) {
                    const normWord = normalizeArabicText(rawWord);
                    if (queryWordsSet.has(normWord)) {
                        const voweledWord = rawWord.replace(/[\u06D6-\u06ED]/g, '');
                        variantsMap.set(voweledWord, (variantsMap.get(voweledWord) || 0) + 1);
                    }
                }
            }
        } else {
            for (const ayah of currentResults) {
                const displaySurah = displayEditionData?.find((s: any) => s.number === ayah.surah?.number);
                const displayAyah = displaySurah?.ayahs.find((a: any) => a.numberInSurah === ayah.numberInSurah);
                const targetText = displayAyah?.text || ayah.text;
                
                const rawWords = targetText.split(/\s+/).filter(Boolean);
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
                        const voweledPhrase = rawWords.slice(i, i + numQueryWords).map(w => w.replace(/[\u06D6-\u06ED]/g, '')).join(' ');
                        variantsMap.set(voweledPhrase, (variantsMap.get(voweledPhrase) || 0) + 1);
                    }
                }
            }
        }

        return Array.from(variantsMap.entries())
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
    }, [deferredResults, queryWords, searchType, isRootSearch, displayEditionData, activePhraseFilter, activeMuqattaatFilter, exactMatch]);

    const occurrencesMap = useMemo(() => {
        if (searchType === 'number' || !query) return [];
        
        const transformedQuery = normalizeArabicText(correctedQuery || query).replace(/"/g, '');
        if (!transformedQuery) return [];

        const occurrences: { itemIndex: number; wordIndex: number; }[] = [];
        const searchTerms = transformedQuery.split(' ');

        displayedResults.forEach((resultAyah, itemIndex) => {
            const ayahWords = getNormalizedWords(resultAyah);
            
            for (let i = 0; i <= ayahWords.length - searchTerms.length; i++) {
                const slice = ayahWords.slice(i, i + searchTerms.length);
                if (slice.join(' ') === searchTerms.join(' ')) {
                    occurrences.push({ itemIndex, wordIndex: i });
                }
            }
        });
        return occurrences;
    }, [displayedResults, query, correctedQuery, searchType]);

    const totalOccurrences = occurrencesMap.length;

    const generalOccurrences = useMemo(() => {
        if (searchType === 'number' || queryWords.length === 0) return 0;
        let count = 0;
        const nWords = queryWords.length;
        for (let i = 0; i < displayedResults.length; i++) {
            const ayahText = getNormalizedText(displayedResults[i]);
            for (let w = 0; w < nWords; w++) {
                const word = queryWords[w];
                let idx = ayahText.indexOf(word);
                while (idx !== -1) {
                    count++;
                    idx = ayahText.indexOf(word, idx + word.length);
                }
            }
        }
        return count;
    }, [deferredResults, queryWords, searchType]);

    const exactOccurrences = useMemo(() => {
        if (searchType === 'number' || queryWords.length === 0) return 0;
        let count = 0;
        const wordSet = new Set(queryWords);
        for (let i = 0; i < displayedResults.length; i++) {
            const ayahWords = getNormalizedWords(displayedResults[i]);
            for (let j = 0; j < ayahWords.length; j++) {
                if (wordSet.has(ayahWords[j])) {
                    count++;
                }
            }
        }
        return count;
    }, [deferredResults, queryWords, searchType]);

    const neighboringWords = useMemo(() => {
        if (searchType === 'number' || !isSingleWordSearch) return [];
        return findNeighboringWords(displayedResults, correctedQuery || query);
    }, [displayedResults, query, correctedQuery, searchType, isSingleWordSearch]);
    
    const handleShowMore = () => setVisibleSuggestionsCount(prev => prev + 7);

    const formatResultsForExport = useCallback((displayEditionData: any[]): string => {
        if (displayedResults.length === 0) return 'لم يتم العثور على نتائج.';

        const savedTemplate = safeLocalStorage.getItem(EXPORT_TEMPLATE_KEY);
        const isTextSearch = searchType === 'text';
        const queryToExport = correctedQuery || query;

        const defaultTemplateForNumber = `ملخص البحث عن الآيات رقم: "{{query}}"
- عدد الآيات التي تم العثور عليها: {{ayah_count}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})
---
{{/results}}
`;

        const defaultTemplate = isTextSearch ? DEFAULT_EXPORT_TEMPLATE : defaultTemplateForNumber;
        let template = savedTemplate || defaultTemplate;

        template = template.replace(/{{query}}/g, queryToExport);
        template = template.replace(/{{ayah_count}}/g, String(displayedResults.length));

        if (isTextSearch) {
            template = template.replace(/{{general_occurrences}}/g, String(generalOccurrences));
            template = template.replace(/{{exact_occurrences}}/g, String(exactOccurrences));
            template = template.replace(/{{exact_match_status}}/g, exactMatch ? 'مفعل' : 'غير مفعل');
        } else {
            template = template.replace(/-\\s*إجمالي التكرارات:.*?\\n/g, '');
            template = template.replace(/-\\s*المطابقات التامة:.*?\\n/g, '');
            template = template.replace(/-\\s*خيار التطابق:.*?\\n/g, '');
        }

        const resultsRegex = /{{#results}}(.*){{\/results}}/s;
        const match = template.match(resultsRegex);

        if (match && match[1]) {
            const itemTemplate = match[1];
            const allResultsString = displayedResults.map(resultAyah => {
                let itemString = itemTemplate;
                const displaySurah = displayEditionData.find(s => s.number === resultAyah.surah!.number);
                const displayAyah = displaySurah?.ayahs.find(a => a.numberInSurah === resultAyah.numberInSurah);
                const textToExport = displayAyah?.text || resultAyah.text || '';

                const rawSurahName = resultAyah.surah?.name || displaySurah?.name || '';
                const cleanSurahName = formatSurahNameForDisplay(rawSurahName);

                itemString = itemString.replace(/{{ayah_text}}/g, textToExport);
                itemString = itemString.replace(/{{surah_name}}/g, cleanSurahName || rawSurahName);
                itemString = itemString.replace(/{{ayah_number_in_surah}}/g, String(resultAyah.numberInSurah));
                return itemString;
            }).join('');
            
            template = template.replace(resultsRegex, allResultsString);
        }

        return template.trim();
    }, [displayedResults, searchType, correctedQuery, query, generalOccurrences, exactOccurrences, exactMatch]);
    
    // Reset filters when query or mode changes
    useEffect(() => {
        setActivePhraseFilter('all');
        setActiveDiacriticFilter('');
        setExactMatch(false);
        setVisibleSuggestionsCount(7);
    }, [query, correctedQuery, isRootSearch]);

    return {
        exactMatch, setExactMatch,
        visibleSuggestionsCount, handleShowMore,
        activePhraseFilter, setActivePhraseFilter,
        activeMuqattaatFilter, setActiveMuqattaatFilter,
        activeDiacriticFilter, setActiveDiacriticFilter,
        diacriticVariants,
        queryWords, isSingleWordSearch,
        phraseFilters,
        displayedResults,
        occurrencesMap, totalOccurrences,
        generalOccurrences, exactOccurrences,
        neighboringWords,
        formatResultsForExport,
    };
};