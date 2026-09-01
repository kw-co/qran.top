const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Props
if (content.includes('targetMuqattaat?: string;')) {
    content = content.replace(
        "targetMuqattaat?: string;",
        "activeMuqattaatFilter?: string;\n    setActiveMuqattaatFilter?: (val: string) => void;\n    baseResults?: Ayah[];"
    );
}

// Update component signature
if (content.includes('targetMuqattaat,')) {
    content = content.replace(
        "targetSurahNumber, targetMuqattaat, displayedResultsCount,",
        "targetSurahNumber, activeMuqattaatFilter = '', setActiveMuqattaatFilter, baseResults = [], displayedResultsCount,"
    );
}

// Update muqattaatInResults calculation to use baseResults
content = content.replace(
    "const surahNumbers = Array.from(new Set(displayedResults.map(a => a.surah?.number).filter((n): n is number => !!n)));",
    "const surahNumbers = Array.from(new Set(baseResults.map(a => a.surah?.number).filter((n): n is number => !!n)));"
);

content = content.replace(
    "const ayah = displayedResults.find(a => a.surah?.number === num);",
    "const ayah = baseResults.find(a => a.surah?.number === num);"
);

// Update title message: "السور التي تبدأ بـ {targetMuqattaat}" to show active filters
content = content.replace(
    /\{targetMuqattaat && \([\s\S]*?السور التي تبدأ بـ \{targetMuqattaat\}\n\s*<\/span>\n\s*\)\}/,
    `{activeMuqattaatFilter && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {activeMuqattaatFilter}
                                </span>
                            )}`
);

// Update onClick logic
const oldMapStr = `const isActive = targetMuqattaat === item.letters;`;
const newMapStr = `
                                const activeArray = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
                                const isActive = activeArray.includes(item.letters);`;

content = content.replace(oldMapStr, newMapStr);

const oldOnClickStr = `onClick={() => {
                                            const safeQuery = finalQueryForChecks ? encodeURIComponent(finalQueryForChecks) : "";
                                            let hash = \`#/search/\${safeQuery}?mode=\${isRootSearch ? "root" : "text"}\`;
                                            if (targetSurahNumber) hash += \`&ts=\${targetSurahNumber}\`;
                                            if (!isActive) {
                                                hash += \`&tm=\${encodeURIComponent(item.letters)}\`;
                                            }
                                            window.location.hash = hash;
                                        }}`;
                                        
const newOnClickStr = `onClick={() => {
                                            if (setActiveMuqattaatFilter) {
                                                let newFilters = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
                                                if (isActive) {
                                                    newFilters = newFilters.filter(f => f !== item.letters);
                                                } else {
                                                    newFilters.push(item.letters);
                                                }
                                                setActiveMuqattaatFilter(newFilters.join(','));
                                            }
                                        }}`;
                                        
content = content.replace(oldOnClickStr, newOnClickStr);

fs.writeFileSync(file, content);
