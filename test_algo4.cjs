const http = require('https');

const normalizeArabicText = (text) => text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').trim();
const STOP_WORDS = new Set(["في", "من", "على", "إلى", "أن", "إن", "ولا", "بما", "وما", "الذي", "التي", "هم", "كانوا", "هو", "هي", "يا", "أيها", "ياأيها", "الذين", "لهم", "بهم", "فيهم", "عليهم", "إليهم", "ثم", "أو", "أم", "بل", "قد", "لقد", "وما", "فما", "كما", "فلما", "كلما", "ألم", "أفلم", "أولم", "فهل", "هل", "عن", "لو", "لولا", "لوما", "حتى", "لما", "إلا"]);

const MUQATTAAT_SURAHS = {
    7: "المص", 19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 36: "يس", 38: "ص", 42: "حم عسق", 50: "ق"
};

const run = async () => {
    return new Promise((resolve) => {
        http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const apiData = JSON.parse(data);
                const quran = apiData.data.surahs;
                
                const surahs = Object.keys(MUQATTAAT_SURAHS).map(id => quran.find(s => s.number == id)).filter(Boolean);
                
                let commonWords = new Set();
                surahs[0].ayahs.forEach(ayah => {
                    const words = ayah.text.split(/\s+/);
                    words.forEach(w => {
                        const nw = normalizeArabicText(w);
                        if (nw.length >= 2 && !STOP_WORDS.has(nw)) {
                            commonWords.add(nw);
                        }
                    });
                });

                for (let i = 1; i < surahs.length; i++) {
                    const s = surahs[i];
                    const currentSurahWords = new Set();
                    s.ayahs.forEach(ayah => {
                        const words = ayah.text.split(/\s+/);
                        words.forEach(w => {
                            const nw = normalizeArabicText(w);
                            if (nw.length >= 2 && !STOP_WORDS.has(nw)) {
                                currentSurahWords.add(nw);
                            }
                        });
                    });
                    commonWords = new Set([...commonWords].filter(x => currentSurahWords.has(x)));
                }

                console.log("Common words >= 2:", [...commonWords]);
                resolve();
            });
        });
    });
};

run();
