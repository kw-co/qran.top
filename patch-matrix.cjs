const fs = require('fs');
let code = fs.readFileSync('components/search/MuqattaatBinaryMatrix.tsx', 'utf8');

// 1. Change handleSurahClick to handleFormulaClick
code = code.replace(
    /const handleSurahClick = useCallback\(\(surahNumber: number\) => {[\s\S]*?}, \[activeMuqattaatFilter, setActiveMuqattaatFilter\]\);/,
    `const handleFormulaClick = useCallback((formula: string) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
        // We no longer use s:surahNumber, we just use the formula directly
        let nextFilters: string[];
        if (currentFilters.includes(formula)) {
            nextFilters = currentFilters.filter(f => f !== formula);
        } else {
            nextFilters = [...currentFilters, formula];
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    }, [activeMuqattaatFilter, setActiveMuqattaatFilter]);`
);

// 2. Change onClick in renderCell
code = code.replace(
    /handleSurahClick\(s.surahNumber\);/,
    `handleFormulaClick(s.letters);`
);

// 3. Add Clear Filter Button
code = code.replace(
    /<div className="flex items-center justify-between text-xs text-text-secondary mb-1">/,
    `<div className="flex items-center justify-between text-xs text-text-secondary mb-1">`
);

fs.writeFileSync('components/search/MuqattaatBinaryMatrix.tsx', code);
