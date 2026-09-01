const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

// The corrupted block:
//                            {targetMuqattaat && (
//                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
//                                    السور التي تبدأ بـ {targetMuqattaat}
//                                </span>
//                            )}</span>
//                                    </span>
//                                </span>
//                            ))}
//                        </div>
//                    </div>
//                )}
//            </div>

const findCorrupted = content.indexOf('</span>\\n                                    </span>\\n                                </span>\\n                            ))}');
console.log('Found corrupted part?', findCorrupted !== -1);

content = content.replace(
    /\{targetMuqattaat && \([\s\S]*?السور التي تبدأ بـ \{targetMuqattaat\}\n\s*<\/span>\n\s*\)\}<\/span>\n\s*<\/span>\n\s*<\/span>\n\s*\}\)\}/,
    `{targetMuqattaat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {targetMuqattaat}
                                </span>
                            )}
                        </h3>
                    ) : (
                        <h3 className="text-lg font-semibold text-text-secondary">الآيات التي تحمل الرقم "<span className="font-bold text-primary-text-strong">{query}</span>"</h3>
                    )}`
);

fs.writeFileSync(file, content);
