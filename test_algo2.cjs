const fs = require('fs');
const http = require('https');

const normalizeArabicText = (text) => text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').trim();

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
                
                let countQal = 0;
                let countHaq = 0;
                
                surahs.forEach(s => {
                    let hasQal = false;
                    let hasHaq = false;
                    s.ayahs.forEach(ayah => {
                        const words = ayah.text.split(/\s+/);
                        words.forEach(w => {
                            const nw = normalizeArabicText(w);
                            if (nw === 'قال') hasQal = true;
                            if (nw === 'حق' || nw === 'الحق') hasHaq = true;
                        });
                    });
                    console.log(`Surah ${s.number}: Qal=${hasQal}, Haq=${hasHaq}`);
                });
                resolve();
            });
        });
    });
};

run();
