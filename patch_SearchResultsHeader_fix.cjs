const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\{targetSurahNumber && \([\s\S]*?السور التي تبدأ بـ \{targetMuqattaat\}\n\s*<\/span>\n\s*\)\}<\/span>\n\s*<\/span>\n\s*<\/span>\n\s*\}\)\}/,
    `{targetSurahNumber && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    في {QURAN_INDEX[targetSurahNumber - 1]?.name}
                                </span>
                            )}
                            {targetMuqattaat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {targetMuqattaat}
                                </span>
                            )}
                        </h3>`
);

fs.writeFileSync(file, content);
