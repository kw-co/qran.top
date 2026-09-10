const http = require('https');
http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const apiData = JSON.parse(data);
        const quran = apiData.data.surahs;
        const s26 = quran.find(s => s.number == 26);
        console.log("S26 haq exact matches:", s26.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));
        
        // Let's also check roots logic
        const s36 = quran.find(s => s.number == 36);
        console.log("S36 haq exact matches:", s36.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));
    });
});
