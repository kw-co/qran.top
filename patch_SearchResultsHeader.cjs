const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('showMuqattaatInSearch?: boolean')) {
    content = content.replace(
        "displayedResults?: Ayah[];\n}",
        "displayedResults?: Ayah[];\n    showMuqattaatInSearch?: boolean;\n}"
    );
}

if (!content.includes('showMuqattaatInSearch = true')) {
    content = content.replace(
        "displayedResults = []\n}) => {",
        "displayedResults = [], showMuqattaatInSearch = true\n}) => {"
    );
}

if (!content.includes('{showMuqattaatInSearch && muqattaatInResults.length > 0 && (')) {
    content = content.replace(
        "{muqattaatInResults.length > 0 && (",
        "{showMuqattaatInSearch && muqattaatInResults.length > 0 && ("
    );
}

// Add the onClick handler to the span
content = content.replace(
    /className="cursor-help hover:text-primary transition-colors duration-150 decoration-dotted underline decoration-primary\/30 underline-offset-2"\s+title=\{item\.tooltip\}\s*>/,
    'className="cursor-pointer hover:text-primary transition-colors duration-150 decoration-dotted underline decoration-primary/30 underline-offset-2"\n                                        title={item.tooltip + " - انقر للفلترة"}\n                                        onClick={() => {\n                                            const safeQuery = finalQueryForChecks ? encodeURIComponent(finalQueryForChecks) : "";\n                                            let hash = `#/search/${safeQuery}?mode=${isRootSearch ? "root" : "text"}`;\n                                            if (targetSurahNumber) hash += `&ts=${targetSurahNumber}`;\n                                            hash += `&tm=${encodeURIComponent(item.letters)}`;\n                                            window.location.hash = hash;\n                                        }}>'
);

fs.writeFileSync(file, content);
