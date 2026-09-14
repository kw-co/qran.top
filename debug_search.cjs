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
        
        const MUQATTAAT_29_SURAHS = [2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68];
        
        const targetWords = ['رسوله'];
        
        for (const w of targetWords) {
            const normalizedTarget = normalizeArabicText(stripDiacritics(w));
            
            let surahsWithWord = new Set();
            for (const surah of quran) {
                for (const ayah of surah.verses) {
                    if (ayah.text.includes(w)) {
                        // wait, normal string inclusion vs exact word matching
                        // the search app uses exact word matching, wait no, search by default is substring
                        // let's check
                    }
                }
            }
        }
    });
});
