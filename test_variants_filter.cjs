const ayahText = "لَا يُعْلَمُونَ ۚ وَهُمْ";
const cleanAyahText = ayahText.replace(/[\u06D6-\u06ED]/g, '').replace(/\s+/g, ' ');
console.log(cleanAyahText.includes("لَا يُعْلَمُونَ"));
