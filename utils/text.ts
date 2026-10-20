import type { CopyTextFormat, CopyCitationFormat, CopyMultiFormat } from '../types';

// Normalizes Arabic-Indic digits (٠-٩) and Eastern Arabic-Indic digits (۰-۹) to standard ASCII digits (0-9)
export const normalizeDigits = (str: string | undefined | null | number): string => {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/[٠۰]/g, '0')
        .replace(/[١۱]/g, '1')
        .replace(/[٢۲]/g, '2')
        .replace(/[٣۳]/g, '3')
        .replace(/[٤۴]/g, '4')
        .replace(/[٥۵]/g, '5')
        .replace(/[٦۶]/g, '6')
        .replace(/[٧۷]/g, '7')
        .replace(/[٨۸]/g, '8')
        .replace(/[٩۹]/g, '9');
};

// Escapes special characters for safely creating dynamic Regular Expressions
export const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Safely decodes URI components without throwing URIError on malformed characters
export const safeDecodeURIComponent = (str: string | undefined | null): string => {
    if (!str) return '';
    try {
        return decodeURIComponent(str);
    } catch {
        try {
            return decodeURI(str);
        } catch {
            return String(str);
        }
    }
};

// Cleans search queries containing Quranic ayah stars (نجمة الآية), brackets, and appended ayah numbers
export const cleanAyahSearchQuery = (query: string | undefined | null): string => {
    if (!query) return '';
    let cleaned = String(query).trim();

    // Remove wrapping or inner ornate Quranic brackets, quotes, and standard parentheses
    cleaned = cleaned.replace(/[«»﴿﴾\(\)\[\]"']/g, ' ');

    // Strip trailing or leading ayah markers with optional numbers (e.g., ۝١, ۝ 1, *1*, (1), ﴿١﴾)
    cleaned = cleaned.replace(/[۝۞۩*٭★☆✪✦✧𖣔܍֍]?\s*[0-9٠-٩۰-۹]+\s*[۝۞۩*٭★☆✪✦✧𖣔܍֍]?\s*$/, ' ');
    cleaned = cleaned.replace(/^\s*[۝۞۩*٭★☆✪✦✧𖣔܍֍]?\s*[0-9٠-٩۰-۹]+\s*[۝۞۩*٭★☆✪✦✧𖣔܍֍]?/, ' ');

    // Strip any standalone ayah star / rosette / decoration characters
    cleaned = cleaned.replace(/[۝۞۩*٭★☆✪✦✧𖣔܍֍]/g, ' ');

    return cleaned.replace(/\s+/g, ' ').trim();
};

// Checks if a search query is asking for an ayah number across all surahs (e.g. 5, ٥, آية 5, الآية ٥, رقم 5, رقم ٥, #5)
export const tryParseSingleAyahNumber = (rawQuery: string | undefined | null): number | null => {
    if (!rawQuery) return null;
    let q = String(rawQuery).trim();
    q = q.replace(/^[«"'\(\[﴿]\s*/, '').replace(/\s*[»"'\)\]﴾]$/, '').trim();
    if (!q) return null;

    // Convert Arabic-Indic and Eastern Arabic-Indic numerals to ASCII digits
    const norm = normalizeDigits(q);

    // 1. Pure number: "5", " 255 "
    if (/^\d+$/.test(norm)) {
        const val = parseInt(norm, 10);
        if (val >= 1 && val <= 286) return val;
    }

    // 2. Prefix variations: آية 5, الآية 5, اية 5, الاية 5, رقم 5, الرقم 5, آية رقم 5, #5
    const match = norm.match(/^(?:(?:ال)?[آاأإ]ية(?:\s*(?:ال)?رقم)?|(?:ال)?رقم|[#№]|ayah|aya)\s*[:#-]?\s*(\d+)$/i);
    if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 1 && val <= 286) return val;
    }

    // 3. Postfix variations: 5 آية, 5 الآية
    const postfixMatch = norm.match(/^(\d+)\s*(?:ال)?[آاأإ]ية$/i);
    if (postfixMatch) {
        const val = parseInt(postfixMatch[1], 10);
        if (val >= 1 && val <= 286) return val;
    }

    return null;
};

// This helper is used to normalize both user input and source text for consistent searching.
export const normalizeArabicText = (word: string | undefined | null | number): string => {
    if (!word) return '';
    
    let cleaned = String(word);

    // Normalize variations of Alif (أ, إ, آ, ٱ) to a plain Alif (ا).
    cleaned = cleaned.replace(/[أإآٱ]/g, 'ا');

    // Normalize Persian/Urdu Yeh (ی) and Alef Maksura (ى) to standard Arabic Yeh (ي).
    cleaned = cleaned.replace(/[یى]/g, 'ي');
    
    // Normalize Persian/Urdu Keheh (ک) to standard Arabic Kaf (ك).
    cleaned = cleaned.replace(/ک/g, 'ك');

    // Normalize Teh Marbuta (ة) to Heh (ه) since users often interchange them and text indexes might differ.
    cleaned = cleaned.replace(/ة/g, 'ه');

    // Remove dagger alif and other non-letter marks that can affect matching.
    // U+0670 is Dagger Alif.
    cleaned = cleaned.replace(/[\u0670ٰ]/g, '');

    // Remove Quranic stars, symbols, and ornamental brackets (نجمة الآية ۝, ۞, ۩, *, etc.)
    cleaned = cleaned.replace(/[۝۞۩*٭★☆✪✦✧𖣔܍֍«»﴿﴾\(\)\[\]"']/g, '');

    // Remove diacritics (Tashkeel) and other Quranic annotation marks.
    // This range covers most common diacritics.
    cleaned = cleaned.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '');

    // Remove Tatweel (Kashida), which is used to stretch characters.
    cleaned = cleaned.replace(/ـ/g, '');

    return cleaned.trim();
};

// This helper strips all diacritics, harakat, tanween, pause marks, and Quranic signs for clean plain text.
export const stripDiacritics = (text: string | undefined | null | number): string => {
    if (!text) return '';
    return String(text)
        // Remove Quranic annotation signs, pause marks (U+06D6 to U+06ED, U+0610 to U+061A)
        .replace(/[\u0610-\u061A\u06D6-\u06ED\u0670]/g, '')
        // Remove Tashkeel: Fatha, Damma, Kasra, Tanween, Shadda, Sukun, Superscript marks
        .replace(/[\u064B-\u065F]/g, '')
        // Remove Tatweel / Kashida
        .replace(/ـ/g, '')
        // Replace multiple spaces with a single space
        .replace(/\s+/g, ' ')
        .trim();
};

// This helper cleans a surah name for clean display (e.g., for copying or UI titles).
export const formatSurahNameForDisplay = (name: string | undefined | null | number): string => {
    if (!name) return '';
    
    // First, remove all common Arabic diacritics (tashkeel), Shadda, and Quranic annotation marks.
    const diacriticsRegex = /[\u0617-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
    let cleaned = String(name).replace(diacriticsRegex, '').replace(/ـ/g, '').trim();

    // Replace Alif Wasla (ٱ) with plain Alif (ا)
    cleaned = cleaned.replace(/ٱ/g, 'ا');

    // Remove any leading "سورة" or "سوره" prefix
    cleaned = cleaned.replace(/^(سورة|سوره)\s*/i, '');

    return cleaned.trim();
};

/**
 * Formats the raw text of an ayah according to the chosen CopyTextFormat.
 */
export const formatAyahText = (rawText: string | undefined | null | number, textFormat: CopyTextFormat = 'clean', fontStyle?: string): string => {
    if (!rawText) return '';
    let text = String(rawText);

    if (textFormat === 'clean') {
        // Strip all diacritics, harakat, and recitation pause marks for raw plain text
        return stripDiacritics(text);
    }

    if (textFormat === 'tashkeel' || textFormat === 'imlaei') {
        // Remove Quranic recitation pause marks (U+06D6 to U+06ED) while keeping standard Arabic diacritics
        const pauseMarksRegex = /[\u06D6-\u06ED]/g;
        return text.replace(pauseMarksRegex, '').replace(/ـ/g, '').replace(/\s+/g, ' ').trim();
    }

    if (textFormat === 'current_view') {
        return text.trim();
    }

    return stripDiacritics(text);
};

/**
 * Formats a single ayah for copying to clipboard according to user settings.
 */
export const formatAyahForCopy = ({
    ayahText,
    surahName,
    surahNumber,
    ayahNumber,
    textFormat = 'clean',
    citationFormat = 'none',
    fontStyle
}: {
    ayahText: string;
    surahName?: string;
    surahNumber?: number;
    ayahNumber: number;
    textFormat?: CopyTextFormat;
    citationFormat?: CopyCitationFormat;
    fontStyle?: string;
}): string => {
    const formattedText = formatAyahText(ayahText, textFormat, fontStyle);
    const cleanSurahName = formatSurahNameForDisplay(surahName || (surahNumber ? `سورة ${surahNumber}` : ''));

    switch (citationFormat) {
        case 'none':
            return formattedText;
        case 'number_only':
            return `${formattedText} (${ayahNumber})`;
        case 'short':
            return cleanSurahName ? `${formattedText} (${cleanSurahName}: ${ayahNumber})` : `${formattedText} (${ayahNumber})`;
        case 'long':
            return cleanSurahName 
                ? `"${formattedText}" (سورة ${cleanSurahName} - الآية ${ayahNumber})`
                : `"${formattedText}" (الآية ${ayahNumber})`;
        case 'quran_brackets':
            return `﴿${formattedText}﴾`;
        case 'quran_brackets_with_ref':
            return cleanSurahName
                ? `﴿${formattedText}﴾ (${cleanSurahName}: ${ayahNumber})`
                : `﴿${formattedText}﴾ (${ayahNumber})`;
        default:
            return formattedText;
    }
};

/**
 * Formats multiple ayahs for copying to clipboard according to user settings.
 */
export const formatMultipleAyahsForCopy = (
    ayahs: { text: string; surahName?: string; surahNumber?: number; ayahNumber: number }[],
    {
        textFormat = 'clean',
        citationFormat = 'none',
        multiFormat = 'numbers_as_separators',
        fontStyle
    }: {
        textFormat?: CopyTextFormat;
        citationFormat?: CopyCitationFormat;
        multiFormat?: CopyMultiFormat;
        fontStyle?: string;
    }
): string => {
    if (!ayahs || ayahs.length === 0) return '';

    const sortedAyahs = [...ayahs].sort((a, b) => {
        if (a.surahNumber && b.surahNumber && a.surahNumber !== b.surahNumber) {
            return a.surahNumber - b.surahNumber;
        }
        return a.ayahNumber - b.ayahNumber;
    });

    if (multiFormat === 'numbers_as_separators') {
        // If only 1 ayah is passed in multiple selection with default 'none' citation, return just the plain ayah text
        if (sortedAyahs.length === 1 && citationFormat === 'none') {
            return formatAyahText(sortedAyahs[0].text, textFormat, fontStyle);
        }
        // Puts ayah numbers as separators between multiple ayahs with NO surah name
        // e.g. "نص الآية الأولى (1) نص الآية الثانية (2)"
        return sortedAyahs.map(a => {
            const formatted = formatAyahText(a.text, textFormat, fontStyle);
            return `${formatted} (${a.ayahNumber})`;
        }).join(' ');
    }

    if (multiFormat === 'consecutive_with_surah' || multiFormat === 'consecutive') {
        // Group by Surah, put ayah numbers, and append Surah name at the end
        const grouped = sortedAyahs.reduce((acc, curr) => {
            const sName = formatSurahNameForDisplay(curr.surahName || (curr.surahNumber ? `سورة ${curr.surahNumber}` : ''));
            if (!acc[sName]) acc[sName] = [];
            acc[sName].push(curr);
            return acc;
        }, {} as Record<string, typeof sortedAyahs>);

        const sections: string[] = [];
        for (const [surahName, sAyahs] of Object.entries(grouped)) {
            const joined = sAyahs.map(a => {
                const formatted = formatAyahText(a.text, textFormat, fontStyle);
                return `${formatted} (${a.ayahNumber})`;
            }).join(' ');

            if (surahName) {
                sections.push(`${joined}\n[سورة ${surahName}]`);
            } else {
                sections.push(joined);
            }
        }
        return sections.join('\n\n---\n\n');
    }

    if (multiFormat === 'plain_continuous') {
        // Continuous text without any numbers or separators
        return sortedAyahs.map(a => formatAyahText(a.text, textFormat, fontStyle)).join(' ');
    }

    if (multiFormat === 'separated') {
        // Each ayah formatted individually using the selected single-ayah citation format
        return sortedAyahs.map(a => formatAyahForCopy({
            ayahText: a.text,
            surahName: a.surahName,
            surahNumber: a.surahNumber,
            ayahNumber: a.ayahNumber,
            textFormat,
            citationFormat,
            fontStyle
        })).join('\n\n');
    }

    // Fallback
    return sortedAyahs.map(a => {
        const formatted = formatAyahText(a.text, textFormat, fontStyle);
        return `${formatted} (${a.ayahNumber})`;
    }).join(' ');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};


export function calculateTextSimilarity(w1: string, w2: string): number {
    if (!w1 && !w2) return 1;
    if (!w1 || !w2) return 0;
    if (String(w1).includes(String(w2)) || String(w2).includes(String(w1))) return 1;
    const s1 = String(w1).replace(/[اويىءأإآؤئهة]/g, "");
    const s2 = String(w2).replace(/[اويىءأإآؤئهة]/g, "");
    if (s1 === s2 && s1.length > 0) return 0.5;
    return 0;
}

export function alignUthmaniToImlaei(uthmaniRawWords: string[], imlaeiText: string, queryWords: string[]) {
    const imlaeiWords = imlaeiText.split(/\s+/).filter(Boolean);
    const imlaeiNorm = imlaeiWords.map(normalizeArabicText);
    const uthmaniNorm = uthmaniRawWords.map(normalizeArabicText);
    
    const matchedImlaei = new Set<number>();
    for (let i = 0; i < imlaeiNorm.length; i++) {
        for (const q of queryWords) {
            const nq = normalizeArabicText(q);
            if (imlaeiNorm[i].includes(nq)) matchedImlaei.add(i);
        }
    }
    
    const dp: number[][] = Array(uthmaniNorm.length + 1).fill(null).map(() => Array(imlaeiNorm.length + 1).fill(0));
    
    for (let i = 1; i <= uthmaniNorm.length; i++) {
        for (let j = 1; j <= imlaeiNorm.length; j++) {
            const uW = uthmaniNorm[i-1];
            const iW = imlaeiNorm[j-1];
            if (uW === "") {
                dp[i][j] = dp[i-1][j];
            } else {
                const match = dp[i-1][j-1] + (calculateTextSimilarity(uW, iW) > 0 ? 1 : 0);
                dp[i][j] = Math.max(match, dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    const result = Array(uthmaniRawWords.length).fill(null).map(() => ({ highlight: false, imlaeiWord: "", imlaeiIndex: -1 }));
    let i = uthmaniNorm.length, j = imlaeiNorm.length;
    while (i > 0 && j > 0) {
        if (uthmaniNorm[i-1] === "") {
            i--; continue;
        }
        const uW = uthmaniNorm[i-1];
        const iW = imlaeiNorm[j-1];
        
        if (calculateTextSimilarity(uW, iW) > 0 && dp[i][j] === dp[i-1][j-1] + 1) {
            result[i-1] = {
                highlight: matchedImlaei.has(j-1),
                imlaeiWord: imlaeiWords[j-1],
                imlaeiIndex: j-1
            };
            i--; j--;
        } else if (dp[i-1][j] >= dp[i][j-1]) {
            i--;
        } else {
            j--;
        }
    }
    return result;
}

export function getUthmaniToImlaeiMap(uthmaniRawWords: string[], imlaeiText: string) {
    const imlaeiWords = imlaeiText.split(/\s+/).filter(Boolean);
    const imlaeiNorm = imlaeiWords.map(normalizeArabicText);
    const uthmaniNorm = uthmaniRawWords.map(normalizeArabicText);
    
    const dp: number[][] = Array(uthmaniNorm.length + 1).fill(null).map(() => Array(imlaeiNorm.length + 1).fill(0));
    
    for (let i = 1; i <= uthmaniNorm.length; i++) {
        for (let j = 1; j <= imlaeiNorm.length; j++) {
            const uW = uthmaniNorm[i-1];
            const iW = imlaeiNorm[j-1];
            if (uW === "") {
                dp[i][j] = dp[i-1][j];
            } else {
                const match = dp[i-1][j-1] + (calculateTextSimilarity(uW, iW) > 0 ? 1 : 0);
                dp[i][j] = Math.max(match, dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    const result = Array(uthmaniRawWords.length).fill(null).map(() => ({ imlaeiWord: "", imlaeiIndex: -1 }));
    let i = uthmaniNorm.length, j = imlaeiNorm.length;
    while (i > 0 && j > 0) {
        if (uthmaniNorm[i-1] === "") {
            i--; continue;
        }
        const uW = uthmaniNorm[i-1];
        const iW = imlaeiNorm[j-1];
        
        if (calculateTextSimilarity(uW, iW) > 0 && dp[i][j] === dp[i-1][j-1] + 1) {
            result[i-1] = {
                imlaeiWord: imlaeiWords[j-1],
                imlaeiIndex: j-1
            };
            i--; j--;
        } else if (dp[i-1][j] >= dp[i][j-1]) {
            i--;
        } else {
            j--;
        }
    }
    return result;
}
