const https = require('https');
https.get('https://raw.githubusercontent.com/risan/quran-json/main/dist/quran.json', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const quran = JSON.parse(body);
        function strip(text) {
            return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u06EA-\u06ED]/g, '');
        }
        for (const s of [2, 7, 10, 40]) {
            const surah = quran.find(x => x.id === s);
            if (!surah) continue;
            for (const ayah of surah.verses) {
                if (strip(ayah.text).includes("رسوله")) {
                    console.log(`Surah ${s}, Ayah ${ayah.id}: ${strip(ayah.text)}`);
                }
            }
        }
    });
});
