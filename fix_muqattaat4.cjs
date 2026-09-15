const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update useMemo to calculate base6 and base7
const calcRegex = /const \{\s*decimalVal,\s*hexVal,\s*base12Val,\s*base19Val,\s*isDivisibleBy19,\s*quotient19,\s*remainder19\s*\} = useMemo\(\(\) => \{[\s\S]*?try \{[\s\S]*?const val = BigInt\('0b' \+ \(binaryString \|\| '0'\)\);[\s\S]*?const isDiv = val > 0n && \(val % 19n === 0n\);[\s\S]*?return \{[\s\S]*?decimalVal: val\.toString\(10\),[\s\S]*?hexVal: '0x' \+ val\.toString\(16\)\.toUpperCase\(\),[\s\S]*?base12Val: bigIntToRadix\(val, 12\),[\s\S]*?base19Val: bigIntToRadix\(val, 19\),[\s\S]*?isDivisibleBy19: isDiv,[\s\S]*?quotient19: isDiv \? \(val \/ 19n\)\.toString\(10\) : null,[\s\S]*?remainder19: \(val % 19n\)\.toString\(10\)[\s\S]*?\};[\s\S]*?\} catch \{[\s\S]*?return \{[\s\S]*?decimalVal: '0',[\s\S]*?hexVal: '0x0',[\s\S]*?base12Val: '0',[\s\S]*?base19Val: '0',[\s\S]*?isDivisibleBy19: false,[\s\S]*?quotient19: null,[\s\S]*?remainder19: '0'[\s\S]*?\};[\s\S]*?\}[\s\S]*?\}, \[binaryString\]\);/;

const calcRepl = `const {
        decimalVal,
        hexVal,
        base6Val,
        base7Val,
        base12Val,
        base19Val,
        isDivisibleBy19,
        quotient19,
        remainder19
    } = useMemo(() => {
        try {
            const val = BigInt('0b' + (binaryString || '0'));
            const isDiv = val > 0n && (val % 19n === 0n);
            return {
                decimalVal: val.toString(10),
                hexVal: '0x' + val.toString(16).toUpperCase(),
                base6Val: bigIntToRadix(val, 6),
                base7Val: bigIntToRadix(val, 7),
                base12Val: bigIntToRadix(val, 12),
                base19Val: bigIntToRadix(val, 19),
                isDivisibleBy19: isDiv,
                quotient19: isDiv ? (val / 19n).toString(10) : null,
                remainder19: (val % 19n).toString(10)
            };
        } catch {
            return {
                decimalVal: '0',
                hexVal: '0x0',
                base6Val: '0',
                base7Val: '0',
                base12Val: '0',
                base19Val: '0',
                isDivisibleBy19: false,
                quotient19: null,
                remainder19: '0'
            };
        }
    }, [binaryString]);`;

content = content.replace(calcRegex, calcRepl);

// Update Report String
const reportRegex = /const report = `====================================\\nتقرير البصمة النورانية \(29 سورة قرآنية\)\\n====================================\\n• كلمة \/ جملة البحث: "\$\{query\}"\\n• عدد السور النورانية المطابقة: \$\{presentCount\} من 29 سورة\\n• مصفوفة التواجد الثنائية \(29-bit\):  \$\{binaryString\}\\n------------------------------------\\nالتحويلات العددية لأنظمة العد:\\n------------------------------------\\n• النظام الثنائي \(Base 2\):       \$\{binaryString\}\\n• النظام العشري \(Base 10\):      \$\{decimalVal\}\\n• النظام الست عشري \(Base 16\):   \$\{hexVal\}\\n• النظام الإثنا عشري \(Base 12\):  \$\{base12Val\}\\n• النظام التسعة عشري \(Base 19\):  \$\{base19Val\}\\n• خاصية القسمة على 19:          \$\{isDivisibleBy19 \? `يقبل القسمة تماماً \(الناتج: \$\{quotient19\}\)` : `لا يقبل القسمة \(الباقي: \$\{remainder19\}\)`\}\\n------------------------------------\\nتفصيل السور الـ 29 بترتيب المصحف:\\n------------------------------------\\n\$\{breakdown\}\\n====================================\\nالمصدر: تطبيق القرآن الكريم التدبري`;/;

const reportRepl = "const report = `====================================\\nتقرير البصمة النورانية (29 سورة قرآنية)\\n====================================\\n• كلمة / جملة البحث: \"${query}\"\\n• عدد السور النورانية المطابقة: ${presentCount} من 29 سورة\\n• مصفوفة التواجد الثنائية (29-bit):  ${binaryString}\\n------------------------------------\\nالتحويلات العددية لأنظمة العد:\\n------------------------------------\\n• النظام الثنائي (Base 2):       ${binaryString}\\n• النظام السداسي (Base 6):       ${base6Val}\\n• النظام السباعي (Base 7):       ${base7Val}\\n• النظام العشري (Base 10):      ${decimalVal}\\n• النظام الست عشري (Base 16):   ${hexVal}\\n• النظام الإثنا عشري (Base 12):  ${base12Val}\\n• النظام التسعة عشري (Base 19):  ${base19Val}\\n• خاصية القسمة على 19:          ${isDivisibleBy19 ? `يقبل القسمة تماماً (الناتج: ${quotient19})` : `لا يقبل القسمة (الباقي: ${remainder19})`}\\n------------------------------------\\nتفصيل السور الـ 29 بترتيب المصحف:\\n------------------------------------\\n${breakdown}\\n====================================\\nالمصدر: تطبيق القرآن الكريم التدبري`;";

content = content.replace(reportRegex, reportRepl);

// Update dependencies array for report
content = content.replace(
    /}, \[items, query, presentCount, binaryString, decimalVal, hexVal, base12Val, base19Val, isDivisibleBy19, quotient19, remainder19\]\);/,
    "}, [items, query, presentCount, binaryString, decimalVal, hexVal, base6Val, base7Val, base12Val, base19Val, isDivisibleBy19, quotient19, remainder19]);"
);

// Update HTML for Layout - Removing old grid layout and ensuring the new one
const oldGridRegex = /<!-- 1\. Visual Matrix -->[\s\S]*?<!-- 2\. Radix converters cards -->/m;
const oldGridStart = content.indexOf('<!-- 1. Visual Matrix -->');
const convertersStart = content.indexOf('<!-- 2. Radix converters cards -->');

if (oldGridStart !== -1 && convertersStart !== -1) {
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
            
            <!-- 2. Radix converters cards -->`;
            
    content = content.substring(0, oldGridStart) + replacementHtml + content.substring(convertersStart + 34);
}

// Update Converters Grid to 7 columns
content = content.replace(
    /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">/g,
    '<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">'
);

// Add base6 and base7 converter cards
const base10Regex = /\{\/\* Base 10 \*\/\}/;
const base10Start = content.indexOf('{/* Base 10 */}');

if (base10Start !== -1) {
    const newConverters = `{/* Base 6 */}
                    <div 
                        onClick={() => handleCopyVal(base6Val, 'base6')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-primary/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>النظام السداسي (Base 6)</span>
                            {copiedKey === 'base6' && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-[13px] text-text-primary font-bold mt-1 break-all group-hover:text-primary transition-colors">
                            {base6Val}
                        </div>
                    </div>

                    {/* Base 7 */}
                    <div 
                        onClick={() => handleCopyVal(base7Val, 'base7')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-primary/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>النظام السباعي (Base 7)</span>
                            {copiedKey === 'base7' && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-[13px] text-text-primary font-bold mt-1 break-all group-hover:text-primary transition-colors">
                            {base7Val}
                        </div>
                    </div>

                    {/* Base 10 */}`;
                    
    content = content.substring(0, base10Start) + newConverters + content.substring(base10Start + 15);
}


fs.writeFileSync(file, content);
console.log("Success");
