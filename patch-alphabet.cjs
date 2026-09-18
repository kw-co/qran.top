const fs = require('fs');
let code = fs.readFileSync('components/AlphabetScannerView.tsx', 'utf8');

if (!code.includes('selectedLetters')) {
    // 1. Add state
    code = code.replace(
        /const \[statusText, setStatusText\] = useState\(''\);/,
        `const [statusText, setStatusText] = useState('');
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);`
    );

    // 2. Add letter grid at the top
    const letterGrid = `
            {/* Filter by First Letter */}
            {results.length > 0 && (
                <div className="bg-surface border border-border-default rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">تصفية حسب الحرف الأول في التسلسل:</span>
                        {selectedLetters.length > 0 && (
                            <button
                                onClick={() => setSelectedLetters([])}
                                className="text-xs text-red-500 hover:text-red-600 bg-red-500/10 px-2 py-1 rounded transition-colors"
                            >
                                إلغاء التصفية
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5" dir="rtl">
                        {ARABIC_LETTERS.split('').map(letter => {
                            const isSelected = selectedLetters.includes(letter);
                            return (
                                <button
                                    key={letter}
                                    onClick={() => setSelectedLetters(prev => prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter])}
                                    className={\`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors \${
                                        isSelected ? 'bg-primary text-primary-text-strong shadow-md' : 'bg-surface-subtle border border-border-default text-text-secondary hover:border-primary hover:text-primary'
                                    }\`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
`;
    code = code.replace(
        /<div className="space-y-4">/,
        `<div className="space-y-4">\n${letterGrid}`
    );

    // 3. Filter results before rendering
    code = code.replace(
        /results\.map\(\(res, i\)/,
        `results.filter(res => {
                        if (selectedLetters.length === 0) return true;
                        // Calculate first letter of the sequence
                        const seen = new Set<string>();
                        let firstLetter = '';
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
                        return selectedLetters.includes(firstLetter);
                    }).map((res, i)`
    );

    fs.writeFileSync('components/AlphabetScannerView.tsx', code);
    console.log("Patched AlphabetScannerView.tsx");
} else {
    console.log("Already patched.");
}
