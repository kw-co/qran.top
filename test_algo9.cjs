const http = require('https');

const run = async () => {
    return new Promise((resolve) => {
        http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const apiData = JSON.parse(data);
                const quran = apiData.data.surahs;
                
                const s26 = quran.find(s => s.number == 26);
                
                const wordsWithHaq = s26.ayahs.filter(a => a.text.includes("حق")).map(a => a.text);
                console.log("Words with haq in S26:", wordsWithHaq);
                
                const s38 = quran.find(s => s.number == 38);
                console.log("Words with haq in S38:", s38.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));

                const s50 = quran.find(s => s.number == 50);
                console.log("Words with haq in S50:", s50.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));
                
                resolve();
            });
        });
    });
};

run();
