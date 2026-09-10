const http = require('https');
http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const apiData = JSON.parse(data);
        const quran = apiData.data.surahs;
        const ids = [7, 19, 20, 26, 27, 28, 36, 38, 42, 50];
        
        for (const id of ids) {
            const s = quran.find(s => s.number == id);
            const hasQal = s.ayahs.some(a => a.text.includes("قال") || a.text.includes("قول") || a.text.includes("يقول"));
            console.log(`Surah ${id} has Qal:`, hasQal);
            
            const hasHaq = s.ayahs.some(a => a.text.includes("حق"));
            console.log(`Surah ${id} has Haq:`, hasHaq);
        }
    });
});
