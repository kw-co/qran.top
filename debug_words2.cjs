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
                .replace(/ي/g, 'ى') // wait, is this actually how `normalizeArabicText` works?
                // LET ME CHECK THE EXACT FILE: text.ts
        }
    });
});
