import { useMemo, useCallback } from 'react';
import type { Ayah, SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import { normalizeArabicText } from '../utils/text';
import { levenshtein } from '../utils/levenshtein';
import { findWordsByRoot } from '../utils/roots';

// Universal helper to get pre-normalized or lazily cached normalized text
const getNormalizedText = (ayah: any): string => {
    if (ayah.normalizedText !== undefined) return ayah.normalizedText;
    if (ayah._normalizedText === undefined) {
        ayah._normalizedText = normalizeArabicText(ayah.text);
    }
    return ayah._normalizedText;
};

export const useSearch = (allQuranData: { [key: string]: SurahData[] } | null) => {
    
    const surahNameMap = useMemo(() => {
        const map = new Map<string, number>();
        QURAN_INDEX.forEach(surah => {
            map.set(normalizeArabicText(surah.name.replace(/^سُورَةُ\s*/, '')), surah.number);
            map.set(normalizeArabicText(surah.name.replace(/^سُورَةُ\s*ال/, '')), surah.number);
        });
        return map;
    }, []);
    
    const simpleSearchableAyahs = useMemo(() => {
        const simpleData = allQuranData?.['quran-simple-clean'];
        if (!simpleData) return [];
        return simpleData.flatMap(surah =>
            surah.ayahs.map(ayah => ({
                ...ayah,
                normalizedText: normalizeArabicText(ayah.text),
                surah: {
                    number: surah.number, name: surah.name, englishName: surah.englishName,
                    englishNameTranslation: surah.englishNameTranslation, revelationType: surah.revelationType,
                }
            }))
        );
    }, [allQuranData?.['quran-simple-clean']]);

    const quranicWordList = useMemo(() => {
        if (!simpleSearchableAyahs || simpleSearchableAyahs.length === 0) return new Set<string>();
        const words = new Set<string>();
        for (let i = 0; i < simpleSearchableAyahs.length; i++) {
            const text = simpleSearchableAyahs[i].normalizedText;
            const parts = text.split(' ');
            for (let j = 0; j < parts.length; j++) {
                const w = parts[j];
                if (w) words.add(w);
            }
        }
        return words;
    }, [simpleSearchableAyahs]);

    const tryParseAyahReference = useCallback((query: string): { surah: number; ayah: number } | null => {
        const cleanedQuery = query.trim().replace(/[أإآ]/g, 'ا').replace(/[آا]ية/g, '').replace(/سورة/g, '');
        const nameMatch = cleanedQuery.match(/^\s*([^\d\s:]+(?:\s+[^\d\s:]+)*)\s*[:\s]\s*(\d+)\s*$/);
        if (nameMatch) {
            const surahName = normalizeArabicText(nameMatch[1].trim());
            const ayahNumber = parseInt(nameMatch[2], 10);
            if (surahNameMap.has(surahName)) return { surah: surahNameMap.get(surahName)!, ayah: ayahNumber };
        }
        const numberMatch = cleanedQuery.match(/^\s*(\d+)\s*[:\s]\s*(\d+)\s*$/);
        if (numberMatch) {
            const surahNumber = parseInt(numberMatch[1], 10);
            const ayahNumber = parseInt(numberMatch[2], 10);
            if (surahNumber > 0 && surahNumber <= 114 && ayahNumber > 0) return { surah: surahNumber, ayah: ayahNumber };
        }
        return null;
    }, [surahNameMap]);

    const performSearch = useCallback((query: string, isRootSearch?: boolean): { results: Ayah[], finalSearchEdition: string, correctedQuery?: string } => {
        if (!allQuranData) return { results: [], finalSearchEdition: 'quran-simple-clean' };
        
        if (isRootSearch) {
            let matchingWords = findWordsByRoot(query, quranicWordList);
            let correctedFromTypo: string | undefined = undefined;

            if (matchingWords.length === 0 && quranicWordList.size > 0) {
                // Find closest word in the Quran using Levenshtein distance
                let minDistance = 3; 
                let bestMatch = '';
                const normalizedQuery = normalizeArabicText(query);
                const queryLen = normalizedQuery.length;
                if (queryLen >= 3) {
                    for (const dictWord of quranicWordList) {
                        if (Math.abs(dictWord.length - queryLen) >= minDistance) continue;
                        const distance = levenshtein(normalizedQuery, dictWord);
                        if (distance < minDistance) { 
                            minDistance = distance; 
                            bestMatch = dictWord; 
                        }
                        if (minDistance === 1) break;
                    }
                }
                if (bestMatch) {
                    matchingWords = findWordsByRoot(bestMatch, quranicWordList);
                    if (matchingWords.length > 0) {
                        correctedFromTypo = bestMatch;
                    }
                }
            }

            if (matchingWords.length === 0) {
                return { results: [], finalSearchEdition: 'quran-simple-clean' };
            }
            
            const matchingWordSet = new Set(matchingWords.map(normalizeArabicText));
            const matchingAyahNumbers: number[] = [];
            
            simpleSearchableAyahs.forEach(ayah => {
                const wordsInAyah = getNormalizedText(ayah).split(/\s+/);
                const hasMatch = wordsInAyah.some(w => matchingWordSet.has(w));
                if (hasMatch) {
                    matchingAyahNumbers.push(ayah.number);
                }
            });
            
            const matchingSet = new Set(matchingAyahNumbers);
            const results = simpleSearchableAyahs.filter(ayah => matchingSet.has(ayah.number));
            return {
                results,
                finalSearchEdition: 'quran-simple-clean',
                correctedQuery: correctedFromTypo ? matchingWords.join(' ') : matchingWords.join(' ')
            };
        }
        
        const executeSearch = (searchQuery: string) => {
            const isExactPhrase = searchQuery.startsWith('"') && searchQuery.endsWith('"');
            const content = isExactPhrase ? searchQuery.substring(1, searchQuery.length - 1) : searchQuery;
            if (!content) return { results: [], finalSearchEdition: 'quran-simple-clean' };

            const searchWords = content.split(/\s+/).filter(Boolean).map(normalizeArabicText);
            const hasDiacritics = /[\u064B-\u065F]/.test(content);
            
            const doSearch = (editionId: string): number[] => {
                if (editionId === 'quran-simple-clean') {
                    const searchPhrase = searchWords.join(' ');
                    const matchingAyahNumbers: number[] = [];
                    const length = simpleSearchableAyahs.length;
                    for (let i = 0; i < length; i++) {
                        const ayah = simpleSearchableAyahs[i];
                        const ayahText = ayah.normalizedText;
                        if (isExactPhrase) {
                            if (ayahText.includes(searchPhrase)) {
                                matchingAyahNumbers.push(ayah.number);
                            }
                        } else {
                            let allMatch = true;
                            for (let w = 0; w < searchWords.length; w++) {
                                if (!ayahText.includes(searchWords[w])) {
                                    allMatch = false;
                                    break;
                                }
                            }
                            if (allMatch) {
                                matchingAyahNumbers.push(ayah.number);
                            }
                        }
                    }
                    return matchingAyahNumbers;
                }

                const dataSource = allQuranData[editionId];
                if (!dataSource) return [];
                const matchingAyahNumbers: number[] = [];
                const searchPhrase = searchWords.join(' ');
                dataSource.forEach(surah => surah.ayahs.forEach(ayah => {
                    const ayahText = getNormalizedText(ayah);
                    if (isExactPhrase) {
                        if (ayahText.includes(searchPhrase)) {
                            matchingAyahNumbers.push(ayah.number);
                        }
                    } else {
                        let allMatch = true;
                        for (let w = 0; w < searchWords.length; w++) {
                            if (!ayahText.includes(searchWords[w])) {
                                allMatch = false;
                                break;
                            }
                        }
                        if (allMatch) {
                            matchingAyahNumbers.push(ayah.number);
                        }
                    }
                }));
                return matchingAyahNumbers;
            };

            let matchingIdentifiers: number[] = [];
            let finalSearchEdition = 'quran-simple-clean';
            if (hasDiacritics && allQuranData['quran-uthmani-quran-academy']) {
                matchingIdentifiers = doSearch('quran-uthmani-quran-academy');
                if (matchingIdentifiers.length > 0) finalSearchEdition = 'quran-uthmani-quran-academy';
                else matchingIdentifiers = doSearch('quran-simple-clean');
            } else {
                matchingIdentifiers = doSearch('quran-simple-clean');
            }
            const matchingSet = new Set(matchingIdentifiers);
            return { results: simpleSearchableAyahs.filter(ayah => matchingSet.has(ayah.number)), finalSearchEdition };
        };

        const initialResult = executeSearch(query);
        const normalizedQuery = normalizeArabicText(query);
        const queryLen = normalizedQuery.length;
        if (initialResult.results.length === 0 && !query.includes(' ') && !query.startsWith('"') && quranicWordList.size > 0 && queryLen >= 3) {
            let minDistance = 3; let bestMatch = '';
            for (const dictWord of quranicWordList) {
                if (Math.abs(dictWord.length - queryLen) >= minDistance) continue;
                const distance = levenshtein(normalizedQuery, dictWord);
                if (distance < minDistance) { minDistance = distance; bestMatch = dictWord; }
                if (minDistance === 1) break;
            }
            if (bestMatch) {
                const correctedResult = executeSearch(bestMatch);
                if (correctedResult.results.length > 0) return { ...correctedResult, correctedQuery: bestMatch };
            }
        }
        return initialResult;
    }, [allQuranData, simpleSearchableAyahs, quranicWordList]);

    const performSearchByAyahNumber = useCallback((ayahNumber: number): Ayah[] => {
        if (!simpleSearchableAyahs) return [];
        return simpleSearchableAyahs.filter(ayah => ayah.numberInSurah === ayahNumber);
    }, [simpleSearchableAyahs]);

    return {
        simpleSearchableAyahs,
        tryParseAyahReference,
        performSearch,
        performSearchByAyahNumber,
    };
};
