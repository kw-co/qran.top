const https = require('https');

https.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const firstAyah = json.data.surahs[0].ayahs[0];
    console.log("quran-simple-clean first ayah:", JSON.stringify(firstAyah));
  });
});
