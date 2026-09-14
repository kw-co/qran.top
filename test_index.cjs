const fs = require('fs');
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
        
        const MUQATTAAT = [2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68];
        const fp = "01000000000000000000000000000";
        
        let wordToSurahs = new Map();
        for (const surah of quran) {
            for (const ayah of surah.verses) {
                const words = ayah.text.split(/\s+/);
                for(const rawWord of words) {
                    const norm = normalizeArabicText(stripDiacritics(rawWord));
                    if(!wordToSurahs.has(norm)) wordToSurahs.set(norm, new Set());
                    wordToSurahs.get(norm).add(surah.id);
                }
            }
        }
        
        let matches = [];
        for (const [word, surahs] of wordToSurahs.entries()) {
            let footprint = "";
            for (const s of MUQATTAAT) {
                footprint += surahs.has(s) ? "1" : "0";
            }
            if(footprint === fp) {
                matches.push(word);
            }
        }
        
        console.log(`Found ${matches.length} matches for footprint ${fp}`);
        console.log(`Contains 'ىجعل': ${matches.includes('ىجعل')}`);
        console.log(`Contains 'لىجعل': ${matches.includes('لىجعل')}`);
        console.log(`Contains 'مىسىح': ${matches.includes('مىسىح')}`); // Just checking
        
    });
});
