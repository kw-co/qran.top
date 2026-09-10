const fs = require('fs');
const MUQATTAAT_SURAHS = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر", 15: "الر",
    19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم", 31: "الم", 32: "الم",
    36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم", 44: "حم", 45: "حم", 46: "حم",
    50: "ق", 68: "ن"
};

const quran = require('./public/quran-simple-clean.json');
const surah7 = quran.find(s => s.index === "7" || s.id === 7 || s.number === 7) || quran[6];
const surah19 = quran[18];
const surah38 = quran[37];

const getWords = (surah) => {
    const words = new Set();
    surah.ayahs.forEach(a => {
        a.text.split(/\s+/).forEach(w => words.add(w));
    });
    return words;
};

const w7 = getWords(surah7);
const w19 = getWords(surah19);
const w38 = getWords(surah38);

const intersection = [...w7].filter(x => w19.has(x) && w38.has(x) && x.length > 3);
console.log("Common words:", intersection);
