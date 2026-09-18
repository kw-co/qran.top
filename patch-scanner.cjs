const fs = require('fs');

// 1. Patch AlphabetScannerView.tsx
let viewCode = fs.readFileSync('components/AlphabetScannerView.tsx', 'utf8');

if (!viewCode.includes('scanMode')) {
    // Add scanMode to ScanResult
    viewCode = viewCode.replace(
        /interface ScanResult \{\s*L: number;\s*R: number;\s*length: number;\s*targetIndex: number;\s*\}/,
        `interface ScanResult {\n    L: number;\n    R: number;\n    length: number;\n    targetIndex: number;\n    scanMode: 'shortest' | 'forward' | 'backward';\n}`
    );

    // Add state for scanMode
    viewCode = viewCode.replace(
        /const \[targetWord, setTargetWord\] = useState\(''\);/,
        `const [targetWord, setTargetWord] = useState('');\n    const [scanMode, setScanMode] = useState<'shortest' | 'forward' | 'backward'>('shortest');`
    );

    // Update processing logic
    const oldLogic = `                let bestLen = Infinity;
                let bestL = -1;
                let bestR = -1;

                for (let L = idx; L >= 0; L--) {
                    if (idx - L >= bestLen) break;
                    let mask = 0;
                    for (let R = L; R < flatWords.length; R++) {
                        if (R - L + 1 >= bestLen) break;
                        mask |= flatWords[R].mask;
                        if (mask === ALL_LETTERS_MASK && R >= idx) {
                            bestLen = R - L + 1;
                            bestL = L;
                            bestR = R;
                            break;
                        }
                    }
                }

                if (bestL !== -1) {
                    foundResults.push({
                        L: bestL,
                        R: bestR,
                        length: bestLen,
                        targetIndex: idx
                    });
                }`;

    const newLogic = `                if (scanMode === 'shortest') {
                    let bestLen = Infinity;
                    let bestL = -1;
                    let bestR = -1;
                    for (let L = idx; L >= 0; L--) {
                        if (idx - L >= bestLen) break;
                        let mask = 0;
                        for (let R = L; R < flatWords.length; R++) {
                            if (R - L + 1 >= bestLen) break;
                            mask |= flatWords[R].mask;
                            if (mask === ALL_LETTERS_MASK && R >= idx) {
                                bestLen = R - L + 1;
                                bestL = L;
                                bestR = R;
                                break;
                            }
                        }
                    }
                    if (bestL !== -1) {
                        foundResults.push({
                            L: bestL,
                            R: bestR,
                            length: bestLen,
                            targetIndex: idx,
                            scanMode: 'shortest'
                        });
                    }
                } else if (scanMode === 'forward') {
                    let mask = 0;
                    let foundR = -1;
                    for (let R = idx; R < flatWords.length; R++) {
                        mask |= flatWords[R].mask;
                        if (mask === ALL_LETTERS_MASK) {
                            foundR = R;
                            break;
                        }
                    }
                    if (foundR !== -1) {
                        foundResults.push({
                            L: idx,
                            R: foundR,
                            length: foundR - idx + 1,
                            targetIndex: idx,
                            scanMode: 'forward'
                        });
                    }
                } else if (scanMode === 'backward') {
                    let mask = 0;
                    let foundL = -1;
                    for (let L = idx; L >= 0; L--) {
                        mask |= flatWords[L].mask;
                        if (mask === ALL_LETTERS_MASK) {
                            foundL = L;
                            break;
                        }
                    }
                    if (foundL !== -1) {
                        foundResults.push({
                            L: foundL,
                            R: idx,
                            length: idx - foundL + 1,
                            targetIndex: idx,
                            scanMode: 'backward'
                        });
                    }
                }`;
    
    viewCode = viewCode.replace(oldLogic, newLogic);

    // Apply letter filtering and update description
    viewCode = viewCode.replace(
        /const displayedResults = results\.slice\(0, 30\);/,
        `
    const filteredResults = useMemo(() => {
        if (selectedLetters.length === 0) return results;
        return results.filter(res => {
            const seen = new Set<string>();
            let firstLetter = '';
            
            if (res.scanMode === 'backward') {
                for (let j = res.R; j >= res.L; j--) {
                    const word = flatWords[j].normalized;
                    for (let k = word.length - 1; k >= 0; k--) {
                        const char = word[k];
                        if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                            firstLetter = char;
                            break;
                        }
                    }
                    if (firstLetter) break;
                }
            } else {
                for (let j = res.L; j <= res.R; j++) {
                    const word = flatWords[j].normalized;
                    for (const char of word) {
                        if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                            firstLetter = char;
                            break;
                        }
                    }
                    if (firstLetter) break;
                }
            }
            return selectedLetters.includes(firstLetter);
        });
    }, [results, selectedLetters, flatWords]);
    
    const displayedResults = filteredResults.slice(0, 30);`
    );

    // Replace the UI to add mode selection
    const uiInputHTML = `<div className="flex flex-col gap-4 mb-4">
                    <label className="text-sm font-bold text-text-primary">اتجاه محرك المسح:</label>
                    <div className="flex flex-wrap gap-4 bg-surface-subtle p-3 rounded-lg border border-border-default">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'shortest'} onChange={() => setScanMode('shortest')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">أقصر نافذة محيطة (متشعب)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'forward'} onChange={() => setScanMode('forward')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">مسح تقدمي (من الكلمة للأمام)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'backward'} onChange={() => setScanMode('backward')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">مسح تراجعي (من الكلمة للخلف)</span>
                        </label>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">`;

    viewCode = viewCode.replace(
        /<div className="flex flex-col sm:flex-row gap-4">/,
        uiInputHTML
    );
    
    // Add filtering UI if it doesn't exist, just above the results grid
    const filterUI = `
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-primary-text">
                            النتائج ({filteredResults.length} موضع)
                        </h2>
                        
                        <div className="flex items-center gap-2">
                            {selectedLetters.length > 0 && (
                                <button 
                                    onClick={() => setSelectedLetters([])}
                                    className="px-3 py-1.5 text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                                >
                                    إلغاء تصفية الحروف ✕
                                </button>
                            )}
                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full font-bold">
                                {scanMode === 'shortest' ? 'مرتبة من الأقصر إلى الأطول' : 'مرتبة حسب موضع الكلمة'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="bg-surface-subtle p-4 rounded-xl border border-border-default">
                        <h3 className="text-sm font-bold text-text-primary mb-3">تصفية حسب أول حرف مكتشف:</h3>
                        <div className="flex flex-wrap gap-1.5" dir="rtl">
                            {ARABIC_LETTERS.split('').map(letter => {
                                const isSelected = selectedLetters.includes(letter);
                                return (
                                    <button
                                        key={letter}
                                        onClick={() => {
                                            setSelectedLetters(prev => 
                                                prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
                                            );
                                        }}
                                        className={\`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-sm transition-all \${
                                            isSelected 
                                                ? 'bg-primary text-white border-primary shadow-md scale-110' 
                                                : 'bg-surface border-border-default text-text-secondary hover:border-primary/50 hover:text-primary'
                                        }\`}
                                    >
                                        {letter}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
`;

    viewCode = viewCode.replace(
        /<div className="space-y-6">\s*<div className="flex items-center justify-between">\s*<h2 className="text-xl font-bold text-primary-text">\s*النتائج \(\{results.length\} موضع\)\s*<\/h2>\s*<span className="text-xs bg-amber-100 dark:bg-amber-900\/30 text-amber-700 dark:text-amber-400 px-3 py-1\.5 rounded-full font-bold">\s*مرتبة من الأقصر إلى الأطول\s*<\/span>\s*<\/div>/,
        filterUI
    );
    
    // Change display count
    viewCode = viewCode.replace(
        /تم عرض أفضل 30 نتيجة من أصل \{results\.length\}\./,
        "تم عرض أفضل 30 نتيجة من أصل {filteredResults.length}."
    );

    // Change Description
    viewCode = viewCode.replace(
        /تقوم هذه الأداة بالبحث عن الكلمة التي تختارها في القرآن الكريم، ثم تبحث في الآيات السابقة واللاحقة لها لتجد <strong>أصغر نافذة نصية \(أقرب مسافة\)<\/strong> تحتوي على جميع الحروف الأبجدية العربية \(28 حرفاً\)\./,
        "تقوم هذه الأداة بالبحث عن الكلمة المطلوبة في القرآن الكريم، وتمسح النصوص القرآنية بناءً على <strong>اتجاه المسح</strong> الذي تحدده (تقدمي أو تراجعي أو محيطي) لتستخرج ترتيب الحروف الأبجدية الـ 28 كما وردت في الآيات."
    );

    fs.writeFileSync('components/AlphabetScannerView.tsx', viewCode);
    console.log("Patched AlphabetScannerView.tsx");
} else {
    console.log("Already patched AlphabetScannerView.tsx");
}

// 2. Patch ScannerResultItem.tsx
let itemCode = fs.readFileSync('components/ScannerResultItem.tsx', 'utf8');

const newSequenceLogic = `    const letterSequence = useMemo(() => {
        const seq: string[] = [];
        const seen = new Set<string>();
        
        if (res.scanMode === 'backward') {
            for (let i = res.R; i >= res.L; i--) {
                const word = flatWords[i].normalized;
                for (let j = word.length - 1; j >= 0; j--) {
                    const char = word[j];
                    if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                        seq.push(char);
                        seen.add(char);
                        if (seq.length === 28) break;
                    }
                }
                if (seq.length === 28) break;
            }
        } else {
            for (let i = res.L; i <= res.R; i++) {
                const word = flatWords[i].normalized;
                for (const char of word) {
                    if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                        seq.push(char);
                        seen.add(char);
                        if (seq.length === 28) break;
                    }
                }
                if (seq.length === 28) break;
            }
        }
        
        return seq;
    }, [res, flatWords]);`;

itemCode = itemCode.replace(
    /const letterSequence = useMemo\(\(\) => \{[\s\S]*?return seq;\s*\}, \[res, flatWords\]\);/,
    newSequenceLogic
);

// Add visual indicator of mode
const modeIndicator = `                <div className="flex items-center gap-2 font-bold text-primary">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        {idx + 1}
                    </div>
                    {res.scanMode === 'backward' ? 'مسح تراجعي' : res.scanMode === 'forward' ? 'مسح تقدمي' : 'أقصر نافذة'} ({res.length} كلمة)
                </div>`;
                
itemCode = itemCode.replace(
    /<div className="flex items-center gap-2 font-bold text-primary">\s*<div className="w-6 h-6 rounded-full bg-primary\/10 flex items-center justify-center">\s*\{idx \+ 1\}\s*<\/div>\s*طول النافذة: \{res\.length\} كلمة\s*<\/div>/,
    modeIndicator
);

fs.writeFileSync('components/ScannerResultItem.tsx', itemCode);
console.log("Patched ScannerResultItem.tsx");

