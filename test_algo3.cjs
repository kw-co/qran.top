const http = require('https');

const getArabicRoot = (word) => {
    // simplified root logic just for check
    return word; // we will use the actual file roots.ts
};

const run = async () => {
    return new Promise((resolve) => {
        http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const apiData = JSON.parse(data);
                const quran = apiData.data.surahs;
                
                const s42 = quran.find(s => s.number == 42);
                const s26 = quran.find(s => s.number == 26);
                const s38 = quran.find(s => s.number == 38);
                const s50 = quran.find(s => s.number == 50);

                const checkQal = (s) => s.ayahs.some(a => a.text.includes("قال") || a.text.includes("يقول"));
                const checkHaq = (s) => s.ayahs.some(a => a.text.includes("حق"));

                console.log("S42 Qal:", checkQal(s42), s42.ayahs.filter(a => a.text.includes("قال") || a.text.includes("يقول") || a.text.includes("قول")).map(a => a.text));
                console.log("S26 Haq:", checkHaq(s26), s26.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));
                console.log("S38 Haq:", checkHaq(s38), s38.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));
                console.log("S50 Haq:", checkHaq(s50), s50.ayahs.filter(a => a.text.includes("حق")).map(a => a.text));

                resolve();
            });
        });
    });
};

run();
