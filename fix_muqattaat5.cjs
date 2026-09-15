const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldGridHtmlStart = content.indexOf('{/* 1. Matrix without horizontal scroll: 3 rows (9 + 9 + 11 = 29 surahs) */}');
const convertersCardsStart = content.indexOf('{/* 2. Radix converters cards */}');

if (oldGridHtmlStart !== -1 && convertersCardsStart !== -1) {
    const replacementHtml = `<!-- 1. Visual Matrix -->
            <div className="bg-surface-subtle border border-border-default rounded-xl p-3 relative space-y-4">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span>انقر على أي سورة ذات قيمة (1) لتصفية النتائج، وانقر على أي رقم لنسخه</span>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                            <input 
                                type="checkbox" 
                                checked={isManualMode}
                                onChange={handleToggleManualMode}
                                className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="font-medium text-[10px] sm:text-xs">الوضع اليدوي (تجريبي)</span>
                        </label>
                        {isManualMode && (
                            <button 
                                onClick={() => setManualSurahs(new Set())}
                                className="text-[10px] sm:text-xs text-red-500 hover:text-red-600 bg-red-500/10 px-2 py-0.5 rounded transition-colors"
                            >
                                تصفير
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 items-center">
                    {layerGroups.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1.5 justify-center w-full">
                            {row.map((item) => (
                                <div key={item.surahNumber} className="w-[14%] max-w-[55px] min-w-[40px]">
                                    {renderCell(item)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            `;
            
    content = content.substring(0, oldGridHtmlStart) + replacementHtml + content.substring(convertersCardsStart);
    fs.writeFileSync(file, content);
    console.log("Success replacing old grid HTML");
} else {
    console.log("Could not find old grid HTML markers");
}

