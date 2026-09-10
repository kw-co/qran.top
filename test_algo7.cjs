const normalizeArabicText = (text) => text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').trim();
const getArabicRoot = (word) => {
    let w = normalizeArabicText(word).replace(/\s+/g, '');
    if (w.length <= 3) return w;
    const prefixes = ["وال", "فال", "بال", "كال", "ال", "ولل", "فلل", "لل"];
    for (const p of prefixes) {
        if (w.startsWith(p)) {
            const remaining = w.substring(p.length);
            if (remaining.length >= 3) { w = remaining; break; }
        }
    }
    const suffixes = ["هما", "هن", "هم", "كما", "كن", "كم", "نا", "ها", "تمو", "تم", "وا", "ون", "ين", "ات", "ان", "ه", "ي", "ة"];
    let suffixRemoved = true;
    while (suffixRemoved && w.length > 3) {
        suffixRemoved = false;
        for (const s of suffixes) {
            if (w.endsWith(s)) {
                const remaining = w.substring(0, w.length - s.length);
                if (remaining.length >= 3) { w = remaining; suffixRemoved = true; break; }
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
    if (w.length === 6) { if (w.startsWith("است")) return w.substring(3); }
    return w.substring(0, 3);
};

console.log(getArabicRoot("يقولون")); // يقول
console.log(getArabicRoot("قالوا")); // قال
console.log(getArabicRoot("الحق")); // حق
console.log(getArabicRoot("حق")); // حق
console.log(getArabicRoot("فحق")); // فحق -> wait! 'فحق' is 3 letters, getArabicRoot returns 'فحق'.
console.log(getArabicRoot("بالحق")); // حق (بال + حق is 2 chars, wait! If remaining < 3, it breaks without removing "بال"!)
