const fs = require('fs');
const file = './components/search/SearchResultsHeader.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `                    {searchType === 'text' ? (
                        <h3 className="text-lg font-semibold text-text-secondary flex items-center gap-2 flex-wrap">
                            <span>{isRootSearch ? 'نتائج البحث عن جذر الكلمة: ' : 'نتائج البحث عن الكلمات: '}</span>
                            <span className="font-bold text-primary-text-strong">{query.replace(/"/g, '')}</span>
                            {targetSurahNumber && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    في {QURAN_INDEX[targetSurahNumber - 1]?.name}
                                </span>
                            )}
                            {targetMuqattaat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    السور التي تبدأ بـ {targetMuqattaat}
                                </span>
                            )}
                        </h3>
                    ) : (
                        <h3 className="text-lg font-semibold text-text-secondary">الآيات التي تحمل الرقم "<span className="font-bold text-primary-text-strong">{query}</span>"</h3>
                    )}
                    
                    {resultsCount > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-text-primary shadow-sm cursor-help" title="إجمالي عدد الآيات التي تحتوي على كلمة البحث.">{displayedResultsCount} آيات</span>
                            {searchType === 'text' && (
                              <>
                                {isSingleWordSearch && !isRootSearch && (
                                  <>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-text-primary shadow-sm cursor-help" title="إجمالي عدد مرات ورود كلمة البحث في كل الآيات.">{generalOccurrences} تكراراً</span>
                                    
                                    <button
                                        onClick={() => {
                                            setExactMatch(!exactMatch);
                                        }}
                                        className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-purple-500
                                        \${exactMatch 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-purple-500/20 text-text-primary hover:bg-purple-500/40'}\`}
                                        title="تفعيل/إلغاء تفعيل المطابقة التامة"
                                        aria-pressed={exactMatch}
                                    >
                                        {exactOccurrences} مطابقة
                                    </button>
                                  </>
                                )}
                                
                                <button
                                    onClick={() => {
                                        if (onToggleRootSearch) onToggleRootSearch(!isRootSearch);
                                    }}
                                    className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-subtle focus:ring-indigo-500
                                    \${isRootSearch 
                                        ? 'bg-indigo-600 text-white font-bold' 
                                        : 'bg-indigo-500/20 text-text-primary hover:bg-indigo-500/40'}\`}
                                    title="البحث عن جميع الكلمات المرتبطة بنفس الجذر اللغوي"
                                    aria-pressed={isRootSearch}
                                >
                                    البحث بالجذر
                                </button>
                              </>
                            )}
                        </div>
                    )}
                </div>
                {showMuqattaatInSearch && muqattaatInResults.length > 0 && (
                    <div className="flex items-center justify-start sm:justify-end flex-shrink-0 w-full sm:w-auto sm:max-w-[45%] bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-lg px-2.5 py-1.5 transition-all select-none">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-primary-text-strong font-bold justify-start sm:justify-end">
                            {muqattaatInResults.map((item, idx) => (
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
                            ))}
                        </div>
                    </div>
                )}
            </div>`;

// Replace from `                    {searchType === 'text' ? (` to `            </div>`
const regex = /\{searchType === 'text' \? \([\s\S]*?\}\)\]\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>/;
const indexStart = content.indexOf("{searchType === 'text' ? (");
const indexEnd = content.indexOf("            {cachedAnalysisExists && shouldShowAnalysisButton && (");

console.log('indexStart', indexStart, 'indexEnd', indexEnd);

if (indexStart !== -1 && indexEnd !== -1) {
    const before = content.substring(0, indexStart - 20); // give some margin
    const after = content.substring(indexEnd);
    
    // find exact start line
    const exactStart = content.lastIndexOf("                    {searchType === 'text' ? (", indexStart + 1);
    const beforeClean = content.substring(0, exactStart);
    
    fs.writeFileSync(file, beforeClean + replacement + "\n" + after);
}

