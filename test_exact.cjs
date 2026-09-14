const https = require('https');
https.get('https://raw.githubusercontent.com/risan/quran-json/main/dist/quran.json', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const quran = JSON.parse(body);
        function normalizeArabicText(text) {
            return text
                .replace(/[أإآا]/g, 'ا')
                .replace(/ة/g, 'ه')
                .replace(/ي/g, 'ى')
                .replace(/ؤ/g, 'و')
                .replace(/ئ/g, 'ى');
        }
        function stripDiacritics(text) {
            return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u06EA-\u06ED]/g, '');
        }
        const targetWords = ['يجعل', 'ليجعل'];
        for (const w of targetWords) {
            const normalizedTarget = normalizeArabicText(stripDiacritics(w));
            let surahsWithWord = new Set();
            for (const surah of quran) {
                for (const ayah of surah.verses) {
                    const words = ayah.text.split(/\s+/);
                    for(const rawWord of words) {
                        const normalizedWord = normalizeArabicText(stripDiacritics(rawWord));
                        if(normalizedWord === normalizedTarget) {
                            surahsWithWord.add(surah.id);
                        }
                    }
                }
            }
            console.log(`Word: ${w}`);
            console.log(`Appears in Surahs: ${Array.from(surahsWithWord).join(', ')}`);
        }
    });
});
