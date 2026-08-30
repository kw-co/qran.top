import { QURAN_INDEX } from './quranIndex';
import { normalizeArabicText } from './utils/text';

const map = new Map<string, number>();
QURAN_INDEX.forEach(surah => {
    map.set(normalizeArabicText(surah.name.replace(/^سُورَةُ\s*/, '')), surah.number);
    map.set(normalizeArabicText(surah.name.replace(/^سُورَةُ\s*ال/, '')), surah.number);
});

console.log(map.get(normalizeArabicText("الكهف")));
console.log(map.get(normalizeArabicText("كهف")));
