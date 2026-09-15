const fs = require('fs');
const file = 'components/FingerprintToolView.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
                    {hasAnyHawameemInResults && (
                        <div className="space-y-2 pt-6 border-t border-border-default">
                            <h2 className="text-lg font-bold text-amber-600">بصمة الحواميم (7 سور)</h2>
                            <HawameemBinaryMatrix
                                query={query}
                                baseResults={searchResult.results}
                                displayedResults={displayedResults}
                                simpleCleanData={simpleCleanData}
                                onNewSearch={onNewSearch}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {query && displayedResults.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h2 className="text-lg font-bold text-primary mb-4 border-b border-border-default pb-2">الآيات المطابقة ({displayedResults.length})</h2>
                    <ul className="space-y-4">
                        {displayedResults.slice(0, visibleCount).map((ayah, index) => {
                            const simpleSurah = simpleCleanData.find(s => s.number === ayah.surah?.number);
                            const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
                            return (
                                <SearchResultItem 
                                    key={ayah.number} 
                                    itemRef={{ current: null }} 
                                    ayah={ayah}
                                    queryWords={[]} 
                                    currentQuery={query} 
                                    onNewSearch={onNewSearch}
                                    displayEdition={displayEdition} 
                                    displayEditionData={displayEditionData} 
                                    searchEdition="quran-simple-clean"
                                    imlaeiSimpleData={imlaeiSimpleData}
                                    fontSize={fontSize} 
                                    fontStyle={fontStyle} 
                                    searchType="text" 
                                    isCurrentlyPlaying={false}
                                    isPlaybackLoading={false}
                                    pulsingWordIndex={-1} 
                                    resultIndex={index}
                                    simpleAyahText={simpleAyah?.text || ''}
                                    copiedAyah={copiedAyah}
                                    onCopyAyah={(ayah) => {
                                        setCopiedAyah(ayah.number);
                                        setTimeout(() => setCopiedAyah(null), 2000);
                                    }}
                                />
                            );
                        })}
                    </ul>
                    {displayedResults.length > visibleCount && (
                        <div className="mt-8 py-6 px-4 bg-surface-subtle border border-border-default rounded-2xl text-center space-y-3 shadow-xs">
                            <div className="text-sm font-bold text-text-primary">
                                تم عرض <span className="text-primary font-mono">{visibleCount}</span> من إجمالي <span className="text-primary font-mono">{displayedResults.length}</span> آية
                            </div>
                            <button 
                                onClick={() => setVisibleCount(prev => prev + 20)}
                                className="px-6 py-2 bg-surface hover:bg-surface-hover border border-border-default rounded-full text-sm font-medium text-text-primary shadow-sm transition-all cursor-pointer"
                            >
                                عرض المزيد من الآيات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
`;

const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('{hasAnyHawameemInResults && ('));

if (startIndex !== -1) {
    const before = lines.slice(0, startIndex).join('\n');
    content = before + '\n' + replacement;
    fs.writeFileSync(file, content);
    console.log("Successfully replaced the end of the file");
} else {
    console.log("Could not find start index");
}
