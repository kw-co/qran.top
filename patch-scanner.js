const fs = require('fs');
let code = fs.readFileSync('components/AlphabetScannerView.tsx', 'utf8');

const replacement = `                    <div className="grid grid-cols-1 gap-4">
                        {displayedResults.map((res, idx) => (
                            <ScannerResultItem key={idx} res={res} idx={idx} flatWords={flatWords} />
                        ))}
                    </div>`;

code = code.replace(/<div className="grid grid-cols-1 gap-4">[\s\S]*?<\/div>[\s]*\{results\.length > 30/, replacement + '\n                    {results.length > 30');

fs.writeFileSync('components/AlphabetScannerView.tsx', code);
