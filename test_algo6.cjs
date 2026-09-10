const normalizeArabicText = (text) => text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').trim();

const getArabicRoot = (word) => {
    let w = normalizeArabicText(word).replace(/\s+/g, '');
    if (w.length <= 3) return w;

    // 1. Remove common prefixes
    const prefixes = ["وال", "فال", "بال", "كال", "ال", "ولل", "فلل", "لل"];
    for (const p of prefixes) {
        if (w.startsWith(p)) {
            const remaining = w.substring(p.length);
            if (remaining.length >= 3) {
                w = remaining;
                break;
            }
        }
    }

    // 2. Remove common suffixes safely
    const suffixes = [
        "هما", "هن", "هم", "كما", "كن", "كم", "نا", "ها", "تمو", "تم", "وا", "ون", "ين", "ات", "ان", "ه", "ي", "ة"
    ];
    let suffixRemoved = true;
    while (suffixRemoved && w.length > 3) {
        suffixRemoved = false;
        for (const s of suffixes) {
            if (w.endsWith(s)) {
                const remaining = w.substring(0, w.length - s.length);
                if (remaining.length >= 3) {
                    w = remaining;
                    suffixRemoved = true;
                    break;
                }
            }
        }
    }

    if (w.length === 3) return w;

    if (w.length === 4) {
        if (w[1] === 'ا') return w[0] + w.substring(2);
        if (w[0] === 'م') return w.substring(1);
        if (w[0] === 'ا') return w.substring(1);
        if (w[0] === 'ي' || w[0] === 'ت' || w[0] === 'ن') return w.substring(1);
        if (w[2] === 'ي') return w.substring(0, 2) + w[3];
        if (w[2] === 'و') return w.substring(0, 2) + w[3];
        if (w[2] === 'ا') return w.substring(0, 2) + w[3];
    }
    if (w.length === 5) {
        if (w[0] === 'م' && w[3] === 'و') return w[1] + w[2] + w[4];
        if (w[0] === 'ت' && w[3] === 'ي') return w[1] + w[2] + w[4];
        if (w[0] === 'م' && w[2] === 'ا') return w[1] + w.substring(3);
        if (w[0] === 'ا' && w[2] === 'ت') return w[1] + w.substring(3);
    }
    if (w.length === 6) {
        if (w.startsWith("است")) return w.substring(3);
    }
    return w.substring(0, 3);
};

const compareRoots = (root1, root2) => {
    let r1 = normalizeArabicText(root1).replace(/\s+/g, '');
    let r2 = normalizeArabicText(root2).replace(/\s+/g, '');

    if (!r1 || !r2) return false;

    if (r1.length === 2) r1 = r1 + r1[1];
    if (r2.length === 2) r2 = r2 + r2[1];

    if (r1 === r2) return true;
    if (r1.length !== r2.length) return false;

    const isWeak = (char) => char === 'ا' || char === 'و' || char === 'ي' || char === 'ى' || char === 'ء' || char === 'أ' || char === 'إ' || char === 'آ' || char === 'ؤ' || char === 'ئ';

    for (let i = 0; i < r1.length; i++) {
        const c1 = r1[i];
        const c2 = r2[i];
        if (c1 === c2) continue;
        if (isWeak(c1) && isWeak(c2)) continue;
        return false;
    }
    return true;
};

// Check if a specific root occurs in all surahs
const http = require('https');
const MUQATTAAT_SURAHS = {
    7: "المص", 19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 36: "يس", 38: "ص", 42: "حم عسق", 50: "ق"
};

const run = async () => {
    return new Promise((resolve) => {
        http.get('https://api.alquran.cloud/v1/quran/quran-simple-clean', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const apiData = JSON.parse(data);
                const quran = apiData.data.surahs;
                
                const surahs = Object.keys(MUQATTAAT_SURAHS).map(id => quran.find(s => s.number == id)).filter(Boolean);
                
                let commonRoots = new Set();
                const STOP_WORDS = new Set(["في", "من", "على", "إلى", "أن", "إن", "ولا", "بما", "وما", "الذي", "التي", "هم", "كانوا", "هو", "هي", "يا", "أيها", "ياأيها", "الذين", "لهم", "بهم", "فيهم", "عليهم", "إليهم", "ثم", "أو", "أم", "بل", "قد", "لقد", "وما", "فما", "كما", "فلما", "كلما", "ألم", "أفلم", "أولم", "فهل", "هل", "عن", "لو", "لولا", "لوما", "حتى", "لما", "إلا"]);

                surahs[0].ayahs.forEach(ayah => {
                    const words = ayah.text.split(/\s+/);
                    words.forEach(w => {
                        const nw = normalizeArabicText(w);
                        if (nw.length >= 2 && !STOP_WORDS.has(nw)) {
                            // try finding if there is a known root equivalence, but since we are just doing intersection
                            commonRoots.add(getArabicRoot(nw));
                        }
                    });
                });

                for (let i = 1; i < surahs.length; i++) {
                    const s = surahs[i];
                    const currentSurahRoots = new Set();
                    s.ayahs.forEach(ayah => {
                        const words = ayah.text.split(/\s+/);
                        words.forEach(w => {
                            const nw = normalizeArabicText(w);
                            if (nw.length >= 2 && !STOP_WORDS.has(nw)) {
                                currentSurahRoots.add(getArabicRoot(nw));
                            }
                        });
                    });
                    
                    // intersection allowing weak root comparisons
                    // because Set.has won't use our compareRoots function!
                    
                    const newCommonRoots = new Set();
                    for (const root of commonRoots) {
                        for (const currentRoot of currentSurahRoots) {
                            if (compareRoots(root, currentRoot)) {
                                newCommonRoots.add(root);
                                break;
                            }
                        }
                    }
                    commonRoots = newCommonRoots;
                }

                console.log("Common roots >= 2 with weak comparison:", [...commonRoots]);
                console.log("Does it contain قال root?", [...commonRoots].some(r => compareRoots(r, "قال")));
                console.log("Does it contain حق root?", [...commonRoots].some(r => compareRoots(r, "حق")));
                
                resolve();
            });
        });
    });
};
run();
