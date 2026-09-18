const fs = require('fs');
let code = fs.readFileSync('components/search/MuqattaatBinaryMatrix.tsx', 'utf8');

const targetSpan = `<span>انقر على أي سورة ذات قيمة (1) لتصفية النتائج، وانقر على أي رقم لنسخه</span>`;
const replacementSpan = `{activeFilterList.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold">تصفية حسب: {activeFilterList.join('، ')}</span>
                            <button 
                                onClick={() => setActiveMuqattaatFilter && setActiveMuqattaatFilter('')}
                                className="text-[10px] sm:text-xs text-red-500 hover:text-red-600 bg-red-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                                إلغاء التصفية
                            </button>
                        </div>
                    ) : (
                        <span>انقر على أي حرف لتصفية النتائج، أو انقر على أي رقم لنسخه</span>
                    )}`;

code = code.replace(targetSpan, replacementSpan);
fs.writeFileSync('components/search/MuqattaatBinaryMatrix.tsx', code);
