const fs = require('fs');
let code = fs.readFileSync('components/ManualView.tsx', 'utf8');

const newFeatures = `
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" /></svg>
                                <div>
                                    <h3 className="feature-title">أدوات البنية القرآنية</h3>
                                    <p className="feature-description">يشمل ماسح الحروف الأبجدية، والمصفوفة النورانية لاستخراج بصمة الكلمات في الفواتح المقطعة، وتحليل أزواج السور والفروق القرآنية.</p>
                                </div>
                            </li>`;

if (!code.includes('أدوات البنية القرآنية')) {
    code = code.replace(
        /<li>\s*<svg className="feature-icon" xmlns="http:\/\/www\.w3\.org\/2000\/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1\.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10\.5 1\.5H8\.25/,
        `${newFeatures}\n                            <li>\n                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25`
    );
    fs.writeFileSync('components/ManualView.tsx', code);
    console.log("Patched ManualView.");
} else {
    console.log("ManualView already patched.");
}
