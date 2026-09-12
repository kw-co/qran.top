import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from './text';
import type { SurahData } from '../types';

/**
 * Standard Madinah Mushaf (604 pages) mapping of each page (index 0 = page 1, ..., index 603 = page 604)
 * to its primary/starting Surah number (1 to 114).
 * Allows instantaneous, zero-latency, offline identification of any page's Surah.
 */
export const PAGE_SURAH_NUMBERS: number[] = [
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
  9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
  11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12,
  12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 14, 14,
  15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18,
  18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
  23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 25, 25,
  25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27,
  27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29, 29, 29, 29, 29,
  29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 32, 32, 32, 33, 33, 33, 33,
  33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36,
  36, 36, 36, 36, 37, 37, 37, 37, 37, 37, 37, 38, 38, 38, 38, 38, 38, 39, 39, 39,
  39, 39, 39, 39, 39, 39, 40, 40, 40, 40, 40, 40, 40, 40, 40, 41, 41, 41, 41, 41,
  41, 42, 42, 42, 42, 42, 42, 42, 43, 43, 43, 43, 43, 43, 44, 44, 44, 45, 45, 45,
  45, 46, 46, 46, 46, 47, 47, 47, 47, 48, 48, 48, 48, 48, 49, 49, 50, 50, 50, 51,
  51, 51, 52, 52, 53, 53, 53, 54, 54, 54, 55, 55, 55, 56, 56, 56, 57, 57, 57, 57,
  58, 58, 58, 58, 59, 59, 59, 60, 60, 60, 61, 62, 62, 63, 64, 64, 65, 65, 66, 66,
  67, 67, 67, 68, 68, 69, 69, 70, 70, 71, 72, 72, 73, 73, 74, 74, 75, 76, 76, 77,
  78, 78, 79, 80, 81, 82, 83, 83, 85, 86, 87, 89, 89, 91, 92, 95, 97, 98, 100, 103,
  106, 109, 112
];

/**
 * Returns the primary Surah number for a given page (1 to 604).
 */
export const getPageSurahNumber = (pageNum: number, quranData?: SurahData[]): number | null => {
  if (pageNum < 1 || pageNum > 604) return null;
  if (quranData && quranData.length > 0) {
    for (const s of quranData) {
      if (s.ayahs && s.ayahs.some(a => a.page === pageNum)) {
        return s.number;
      }
    }
  }
  return PAGE_SURAH_NUMBERS[pageNum - 1] || null;
};

/**
 * Returns the clean Surah name (without the word 'سورة') for a given page number.
 * Example: for page 490, returns "الزخرف".
 */
export const getPageSurahName = (pageNum: number, quranData?: SurahData[]): string => {
  const surahNum = getPageSurahNumber(pageNum, quranData);
  if (!surahNum) return '';
  const ref = QURAN_INDEX.find(s => s.number === surahNum);
  if (!ref) return '';
  return formatSurahNameForDisplay(ref.name);
};
