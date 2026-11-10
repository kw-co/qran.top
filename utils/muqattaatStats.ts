import type { Ayah, SurahData } from '../types';
import { normalizeArabicText } from './text';
import { FULL_29_MUQATTAAT_LIST } from '../components/search/SearchResultsHeader';

export interface MuqattaatSurahStat {
  surah: number;
  name: string;
  letters: string;
  count: number;
  ayahsCount: number;
  isMentioned: boolean;
  isDisplayed: boolean;
  isFilterActive: boolean;
  isSurahFiltered: boolean;
  isFormulaFiltered: boolean;
}

export const computeMuqattaatStats = (
  sourceResults: Ayah[],
  displayedResults: Ayah[],
  query: string,
  exactMatch: boolean,
  activeMuqattaatFilter: string = '',
  activePhraseFilter?: string,
  activeDiacriticFilter?: string,
  displayEditionData?: SurahData[]
): MuqattaatSurahStat[] => {
  const currentFilteredNumbers = new Set(displayedResults.map(a => a.surah?.number).filter((n): n is number => !!n));
  const activeFiltersList = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);

  const transformedQuery = normalizeArabicText(String(query || '')).replace(/"/g, '').trim();
  const searchWords = transformedQuery ? transformedQuery.split(/\s+/).filter(Boolean) : [];

  const hasDiacriticFilter = Boolean(activeDiacriticFilter && activeDiacriticFilter.trim() !== '');
  const dFilters = hasDiacriticFilter ? activeDiacriticFilter!.split(',').map(f => f.trim()).filter(Boolean) : [];

  const hasPhraseFilter = Boolean(activePhraseFilter && activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '');
  const pFilters = hasPhraseFilter ? activePhraseFilter!.split(',').map(f => f.trim()).filter(Boolean) : [];

  return FULL_29_MUQATTAAT_LIST.map(({ surah, name, letters }) => {
    const surahAyahs = (sourceResults || []).filter(a => a.surah?.number === surah);
    const ayahsCount = surahAyahs.length;

    let occurrences = 0;
    if (ayahsCount > 0) {
      if (hasDiacriticFilter && dFilters.length > 0) {
        for (const ayah of surahAyahs) {
          const displaySurah = displayEditionData?.find(s => s.number === ayah.surah?.number);
          const displayAyah = displaySurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
          const targetText = String(displayAyah?.text || ayah.text || '');
          const cleanAyahText = targetText
            .replace(/[\u0610-\u061A\u06D6-\u06ED۝۞۩*٭★☆✪✦✧𖣔܍֍«»﴿﴾\(\)\[\]"'ـ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const words = cleanAyahText.split(' ').filter(Boolean);

          let matchedInAyah = 0;
          for (const rawDf of dFilters) {
            const df = rawDf
              .replace(/[\u0610-\u061A\u06D6-\u06ED۝۞۩*٭★☆✪✦✧𖣔܍֍«»﴿﴾\(\)\[\]"'ـ]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (!df) continue;
            if (!df.includes(' ')) {
              for (const w of words) {
                if (w === df) matchedInAyah++;
              }
            } else {
              const dfParts = df.split(' ').filter(Boolean);
              for (let i = 0; i <= words.length - dfParts.length; i++) {
                if (words.slice(i, i + dfParts.length).join(' ') === df) {
                  matchedInAyah++;
                }
              }
            }
          }
          occurrences += (matchedInAyah > 0 ? matchedInAyah : 1);
        }
      } else if (hasPhraseFilter && pFilters.length > 0) {
        for (const ayah of surahAyahs) {
          const ayahNorm = normalizeArabicText(ayah.text || '');
          let matchedInAyah = 0;
          for (const pf of pFilters) {
            const normPf = normalizeArabicText(pf);
            let idx = ayahNorm.indexOf(normPf);
            while (idx !== -1) {
              matchedInAyah++;
              idx = ayahNorm.indexOf(normPf, idx + Math.max(1, normPf.length));
            }
          }
          occurrences += (matchedInAyah > 0 ? matchedInAyah : 1);
        }
      } else if (searchWords.length > 0) {
        for (const ayah of surahAyahs) {
          if (!ayah.text) {
            occurrences++;
            continue;
          }
          const ayahNorm = normalizeArabicText(ayah.text);
          const words = ayahNorm.split(/\s+/).filter(Boolean);

          if (exactMatch) {
            for (let i = 0; i <= words.length - searchWords.length; i++) {
              const slice = words.slice(i, i + searchWords.length);
              if (slice.join(' ') === searchWords.join(' ')) {
                occurrences++;
              }
            }
          } else if (searchWords.length === 1) {
            const target = searchWords[0];
            for (const w of words) {
              if (w.includes(target)) {
                occurrences++;
              }
            }
          } else {
            for (let i = 0; i <= words.length - searchWords.length; i++) {
              const slice = words.slice(i, i + searchWords.length);
              if (slice.join(' ') === searchWords.join(' ')) {
                occurrences++;
              }
            }
          }
        }
      }
    }

    const count = occurrences > 0 ? occurrences : ayahsCount;
    const isMentioned = count > 0;
    const isDisplayed = currentFilteredNumbers.has(surah);
    const isSurahFiltered = activeFiltersList.includes(`s:${surah}`);
    const isFormulaFiltered = activeFiltersList.includes(letters);
    const isFilterActive = isSurahFiltered || isFormulaFiltered;

    return {
      surah,
      name,
      letters,
      count,
      ayahsCount,
      isMentioned,
      isDisplayed,
      isFilterActive,
      isSurahFiltered,
      isFormulaFiltered
    };
  });
};
