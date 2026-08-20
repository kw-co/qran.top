fetch("https://quran.com/fonts/quran/hafs/v1/woff2/p1.woff2")
  .then(res => console.log("OK:", res.ok, "Status:", res.status))
  .catch(err => console.log("Error:", err.message));
