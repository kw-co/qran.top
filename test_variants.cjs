const normalize = (word) => {
    let cleaned = word;
    cleaned = cleaned.replace(/[أإآٱ]/g, 'ا');
    cleaned = cleaned.replace(/[\u0670ٰ]/g, '');
    cleaned = cleaned.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '');
    cleaned = cleaned.replace(/ـ/g, '');
    return cleaned.trim();
};

const query = "علم";
const queryWords = query.split(' ');
const numQueryWords = queryWords.length;

const results = [
    { text: "وَلَقَدْ عَلِمَ الَّذِينَ ۖ" },
    { text: "لَا يُعْلَمُ" },
    { text: "وَعُلِمَ مَا فِي" }
];

const variantsMap = new Map();

for (const ayah of results) {
    const rawWords = ayah.text.split(/\s+/).filter(Boolean);
    const normWords = rawWords.map(w => normalize(w));

    for (let i = 0; i <= normWords.length - numQueryWords; i++) {
        let match = true;
        for (let j = 0; j < numQueryWords; j++) {
            if (normWords[i + j] !== queryWords[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            const voweledPhrase = rawWords.slice(i, i + numQueryWords).map(w => w.replace(/[\u06D6-\u06ED]/g, '')).join(' ');
            variantsMap.set(voweledPhrase, (variantsMap.get(voweledPhrase) || 0) + 1);
        }
    }
}
console.log(Array.from(variantsMap.entries()).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count));
