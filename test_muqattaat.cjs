const fs = require('fs');

const normalize = (text) => text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').trim();

const MUQATTAAT_SURAHS = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر", 15: "الر",
    19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم", 31: "الم", 32: "الم",
    36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم", 44: "حم", 45: "حم", 46: "حم",
    50: "ق", 68: "ن"
};

const quranPath = './public/quran-simple-clean.json';
if (!fs.existsSync(quranPath)) {
    console.log("No quran json");
    process.exit();
}
const quran = require(quranPath);
// Get simple clean surahs
// Wait, the public file might not exist. The app fetches from API.
