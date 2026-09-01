const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `{muqattaatInResults.map((item, idx) => (
                                <span key={item.letters} className="inline-flex items-center">
                                    {idx > 0 && <span className="mx-1 text-text-muted/40 font-normal">-</span>}
                                    <span 
                                        className="cursor-pointer hover:text-primary transition-colors duration-150 decoration-dotted underline decoration-primary/30 underline-offset-2"
                                        title={item.tooltip + " - انقر للفلترة"}
                                        onClick={() => {
                                            const safeQuery = finalQueryForChecks ? encodeURIComponent(finalQueryForChecks) : "";
                                            let hash = \`#/search/\${safeQuery}?mode=\${isRootSearch ? "root" : "text"}\`;
                                            if (targetSurahNumber) hash += \`&ts=\${targetSurahNumber}\`;
                                            hash += \`&tm=\${encodeURIComponent(item.letters)}\`;
                                            window.location.hash = hash;
                                        }}
                                    >
                                        {item.letters} <span className="text-primary/80 font-normal text-[10px]">({item.surahs.length})</span>
                                    </span>
                                </span>
                            ))}`;

const replaceStr = `{muqattaatInResults.map((item, idx) => {
                                const isActive = targetMuqattaat === item.letters;
                                return (
                                <span key={item.letters} className="inline-flex items-center">
                                    {idx > 0 && <span className="mx-1 text-text-muted/40 font-normal">-</span>}
                                    <span 
                                        className={\`cursor-pointer transition-all duration-150 decoration-dotted underline underline-offset-2 \${isActive ? 'text-primary font-bold decoration-primary bg-primary/10 rounded px-1' : 'hover:text-primary decoration-primary/30'}\`}
                                        title={isActive ? item.tooltip + " - انقر لإلغاء الفلترة" : item.tooltip + " - انقر للفلترة"}
                                        onClick={() => {
                                            const safeQuery = finalQueryForChecks ? encodeURIComponent(finalQueryForChecks) : "";
                                            let hash = \`#/search/\${safeQuery}?mode=\${isRootSearch ? "root" : "text"}\`;
                                            if (targetSurahNumber) hash += \`&ts=\${targetSurahNumber}\`;
                                            if (!isActive) {
                                                hash += \`&tm=\${encodeURIComponent(item.letters)}\`;
                                            }
                                            window.location.hash = hash;
                                        }}
                                    >
                                        {item.letters} <span className={\`font-normal text-[10px] \${isActive ? 'text-primary' : 'text-primary/80'}\`}>({item.surahs.length})</span>
                                    </span>
                                </span>
                                );
                            })}`;

if (content.includes('hash += `&tm=${encodeURIComponent(item.letters)}`;')) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(file, content);
    console.log("Successfully patched!");
} else {
    console.log("Could not find the target string.");
}
