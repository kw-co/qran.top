import type { SurahData } from '../types';
import { normalizeArabicText } from './text';

export type AttachmentMode = 'all_adjacent' | 'after_only' | 'before_only' | 'all_in_word';

export const ARABIC_LETTERS_NAMES: Record<string, string> = {
    'ا': 'ألف',
    'ب': 'باء',
    'ت': 'تاء',
    'ث': 'ثاء',
    'ج': 'جيم',
    'ح': 'حاء',
    'خ': 'خاء',
    'د': 'دال',
    'ذ': 'ذال',
    'ر': 'راء',
    'ز': 'زاي',
    'س': 'سين',
    'ش': 'شين',
    'ص': 'صاد',
    'ض': 'ضاد',
    'ط': 'طاء',
    'ظ': 'ظاء',
    'ع': 'عين',
    'غ': 'غين',
    'ف': 'فاء',
    'ق': 'قاف',
    'ك': 'كاف',
    'ل': 'لام',
    'م': 'ميم',
    'ن': 'نون',
    'ه': 'هاء',
    'و': 'واو',
    'ي': 'ياء',
    'ء': 'همزة'
};

export const POPULAR_SYLLABLE_PRESETS = [
    { syllable: 'حم', title: 'حم (الحواميم)', description: 'مقطع الفواتح الشهير، يلتصق به حرف الدال بكثرة (الحمد، محمد، حميد)' },
    { syllable: 'الم', title: 'الم (ألم)', description: 'من أكثر المقاطع ارتباطاً بالأفعال والحروف في القرآن' },
    { syllable: 'طه', title: 'طه', description: 'مقطع سورة طه والكلمات المرتبطة به' },
    { syllable: 'يس', title: 'يس', description: 'مقطع سورة يس والمفردات القرآنية المقترنة به' },
    { syllable: 'حمد', title: 'حمد', description: 'جذر الحمد والثناء، لارتباطه بالحروف الزائدة' },
    { syllable: 'سبح', title: 'سبح', description: 'التسبيح وتصريفاته القرآنية' },
    { syllable: 'علم', title: 'علم', description: 'جذر العلم والمعرفة مع سوابقه ولواحقه' },
    { syllable: 'خلق', title: 'خلق', description: 'الخلق والإيجاد وتصريفاته في القرآن' },
    { syllable: 'كتب', title: 'كتب', description: 'الكتابة والكتاب مع اتصال الضمائر والحروف' },
    { syllable: 'ذكر', title: 'ذكر', description: 'الذكر والتذكير مع حروف الزيادة' },
    { syllable: 'نزل', title: 'نزل', description: 'النزول والتنزيل القرآني' },
    { syllable: 'صدق', title: 'صدق', description: 'الصدق والتصديق' },
    { syllable: 'حكم', title: 'حكم', description: 'الحكم والحكمة والحكام' },
    { syllable: 'رحم', title: 'رحم', description: 'الرحمة والرحيم والرحمن' }
];

export interface AttachedLetterStats {
    letter: string;
    letterName: string;
    totalCount: number;
    afterCount: number;
    beforeCount: number;
    inWordCount: number;
    percentage: number;
    exampleWords: string[];
    position?: 'before' | 'after' | 'both';
}

export interface SyllableMatch {
    id: string;
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    ayahText: string;
    wordIndex: number;
    originalWord: string;
    normalizedWord: string;
    attachedBefore: string | null;
    attachedAfter: string | null;
    matchStartIndex: number;
    matchEndIndex: number;
}

export interface SyllableAnalysisResult {
    syllable: string;
    normalizedSyllable: string;
    totalOccurrences: number;
    totalMatchingWords: number;
    totalAttachmentsCount: number;
    totalBeforeCount: number;
    totalAfterCount: number;
    top4: AttachedLetterStats[];
    top4Before: AttachedLetterStats[];
    top4After: AttachedLetterStats[];
    allLettersBefore: AttachedLetterStats[];
    allLettersAfter: AttachedLetterStats[];
    allLetters: AttachedLetterStats[];
    surahDistribution: { surahNumber: number; surahName: string; count: number }[];
    matches: SyllableMatch[];
}

/**
 * Analyzes Quran words to find which letters are attached/adjacent to a given syllable/substring.
 */
export function analyzeSyllableAttachments(
    simpleCleanData: SurahData[],
    syllableQuery: string,
    mode: AttachmentMode = 'all_adjacent',
    surahFilter?: number
): SyllableAnalysisResult {
    const rawSyllable = syllableQuery.trim();
    const normSyllable = normalizeArabicText(rawSyllable);

    if (!normSyllable || !simpleCleanData || simpleCleanData.length === 0) {
        return {
            syllable: rawSyllable,
            normalizedSyllable: normSyllable,
            totalOccurrences: 0,
            totalMatchingWords: 0,
            totalAttachmentsCount: 0,
            totalBeforeCount: 0,
            totalAfterCount: 0,
            top4: [],
            top4Before: [],
            top4After: [],
            allLettersBefore: [],
            allLettersAfter: [],
            allLetters: [],
            surahDistribution: [],
            matches: []
        };
    }

    const matches: SyllableMatch[] = [];
    const letterStatsMap: Record<string, {
        letter: string;
        afterCount: number;
        beforeCount: number;
        inWordCount: number;
        allExamples: Set<string>;
        beforeExamples: Set<string>;
        afterExamples: Set<string>;
    }> = {};

    const surahCountMap: Record<number, { surahNumber: number; surahName: string; count: number }> = {};
    let totalMatchingWords = 0;
    let matchCounter = 0;

    const getOrInitStats = (char: string) => {
        if (!letterStatsMap[char]) {
            letterStatsMap[char] = {
                letter: char,
                afterCount: 0,
                beforeCount: 0,
                inWordCount: 0,
                allExamples: new Set<string>(),
                beforeExamples: new Set<string>(),
                afterExamples: new Set<string>()
            };
        }
        return letterStatsMap[char];
    };

    const targetSurahs = surahFilter 
        ? simpleCleanData.filter(s => s.number === surahFilter)
        : simpleCleanData;

    targetSurahs.forEach(surah => {
        const cleanSurahName = surah.name.replace(/سُورَةُ\s*/g, '');

        surah.ayahs.forEach(ayah => {
            const rawWords = ayah.text.split(/\s+/).filter(Boolean);

            rawWords.forEach((word, wIdx) => {
                const normWord = normalizeArabicText(word);
                if (!normWord.includes(normSyllable)) return;

                totalMatchingWords++;
                let searchIdx = 0;

                while (searchIdx < normWord.length) {
                    const foundIdx = normWord.indexOf(normSyllable, searchIdx);
                    if (foundIdx === -1) break;

                    const matchEnd = foundIdx + normSyllable.length;
                    const beforeChar = foundIdx > 0 ? normWord[foundIdx - 1] : null;
                    const afterChar = matchEnd < normWord.length ? normWord[matchEnd] : null;

                    // Track surah frequency
                    if (!surahCountMap[surah.number]) {
                        surahCountMap[surah.number] = {
                            surahNumber: surah.number,
                            surahName: cleanSurahName,
                            count: 0
                        };
                    }
                    surahCountMap[surah.number].count++;

                    // Register stats for attached letters
                    if (beforeChar && beforeChar.match(/[\u0621-\u064A]/)) {
                        const s = getOrInitStats(beforeChar);
                        s.beforeCount++;
                        if (s.beforeExamples.size < 5) s.beforeExamples.add(word);
                        if (s.allExamples.size < 5) s.allExamples.add(word);
                    }

                    if (afterChar && afterChar.match(/[\u0621-\u064A]/)) {
                        const s = getOrInitStats(afterChar);
                        s.afterCount++;
                        if (s.afterExamples.size < 5) s.afterExamples.add(word);
                        if (s.allExamples.size < 5) s.allExamples.add(word);
                    }

                    // Also record all distinct other characters in the word for inWord mode
                    const otherChars = new Set(normWord.split('').filter((c, i) => (i < foundIdx || i >= matchEnd) && c.match(/[\u0621-\u064A]/)));
                    otherChars.forEach(char => {
                        const s = getOrInitStats(char);
                        s.inWordCount++;
                        if (s.allExamples.size < 5) s.allExamples.add(word);
                    });

                    matches.push({
                        id: `match_${surah.number}_${ayah.numberInSurah}_${wIdx}_${matchCounter++}`,
                        surahNumber: surah.number,
                        surahName: cleanSurahName,
                        ayahNumber: ayah.numberInSurah,
                        ayahText: ayah.text,
                        wordIndex: wIdx,
                        originalWord: word,
                        normalizedWord: normWord,
                        attachedBefore: beforeChar,
                        attachedAfter: afterChar,
                        matchStartIndex: foundIdx,
                        matchEndIndex: matchEnd
                    });

                    searchIdx = foundIdx + 1;
                }
            });
        });
    });

    // Compute effective counts based on active mode
    const lettersArray = Object.values(letterStatsMap).map(item => {
        let count = 0;
        if (mode === 'all_adjacent') {
            count = item.afterCount + item.beforeCount;
        } else if (mode === 'after_only') {
            count = item.afterCount;
        } else if (mode === 'before_only') {
            count = item.beforeCount;
        } else {
            count = item.inWordCount;
        }

        return {
            letter: item.letter,
            letterName: ARABIC_LETTERS_NAMES[item.letter] || item.letter,
            totalCount: count,
            afterCount: item.afterCount,
            beforeCount: item.beforeCount,
            inWordCount: item.inWordCount,
            percentage: 0,
            exampleWords: Array.from(item.allExamples),
            position: 'both' as const
        };
    }).filter(item => item.totalCount > 0);

    // Sort descending by totalCount
    lettersArray.sort((a, b) => b.totalCount - a.totalCount);

    const totalAttachmentsCount = lettersArray.reduce((acc, item) => acc + item.totalCount, 0);

    // Compute percentages
    lettersArray.forEach(item => {
        item.percentage = totalAttachmentsCount > 0 
            ? Math.round((item.totalCount / totalAttachmentsCount) * 1000) / 10
            : 0;
    });

    const top4 = lettersArray.slice(0, 4);

    // 1. Separate Calculation for FRONT / BEFORE (قدام المقطع - السوابق)
    const allLettersBefore: AttachedLetterStats[] = Object.values(letterStatsMap)
        .filter(item => item.beforeCount > 0)
        .map(item => ({
            letter: item.letter,
            letterName: ARABIC_LETTERS_NAMES[item.letter] || item.letter,
            totalCount: item.beforeCount,
            afterCount: item.afterCount,
            beforeCount: item.beforeCount,
            inWordCount: item.inWordCount,
            percentage: 0,
            exampleWords: Array.from(item.beforeExamples),
            position: 'before' as const
        }))
        .sort((a, b) => b.beforeCount - a.beforeCount);

    const totalBeforeCount = allLettersBefore.reduce((acc, item) => acc + item.beforeCount, 0);
    allLettersBefore.forEach(item => {
        item.percentage = totalBeforeCount > 0
            ? Math.round((item.beforeCount / totalBeforeCount) * 1000) / 10
            : 0;
    });
    const top4Before = allLettersBefore.slice(0, 4);

    // 2. Separate Calculation for BACK / AFTER (ورى المقطع - اللواحق)
    const allLettersAfter: AttachedLetterStats[] = Object.values(letterStatsMap)
        .filter(item => item.afterCount > 0)
        .map(item => ({
            letter: item.letter,
            letterName: ARABIC_LETTERS_NAMES[item.letter] || item.letter,
            totalCount: item.afterCount,
            afterCount: item.afterCount,
            beforeCount: item.beforeCount,
            inWordCount: item.inWordCount,
            percentage: 0,
            exampleWords: Array.from(item.afterExamples),
            position: 'after' as const
        }))
        .sort((a, b) => b.afterCount - a.afterCount);

    const totalAfterCount = allLettersAfter.reduce((acc, item) => acc + item.afterCount, 0);
    allLettersAfter.forEach(item => {
        item.percentage = totalAfterCount > 0
            ? Math.round((item.afterCount / totalAfterCount) * 1000) / 10
            : 0;
    });
    const top4After = allLettersAfter.slice(0, 4);

    const surahDistribution = Object.values(surahCountMap).sort((a, b) => b.count - a.count);

    return {
        syllable: rawSyllable,
        normalizedSyllable: normSyllable,
        totalOccurrences: matches.length,
        totalMatchingWords,
        totalAttachmentsCount,
        totalBeforeCount,
        totalAfterCount,
        top4,
        top4Before,
        top4After,
        allLettersBefore,
        allLettersAfter,
        allLetters: lettersArray,
        surahDistribution,
        matches
    };
}
