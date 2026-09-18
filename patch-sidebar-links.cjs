const fs = require('fs');
let code = fs.readFileSync('components/SidePanel.tsx', 'utf8');

// 1. Shorten the text
code = code.replace(
    /<span className="whitespace-nowrap font-medium text-text-primary">إضافة للشاشة الرئيسية \(بدون متجر\)<\/span>/g,
    '<span className="whitespace-nowrap font-medium text-text-primary">تثبيت التطبيق</span>'
);

// 2. Add the two links side by side. 
// We'll insert them right after the PWA button closing tag inside the <nav>
const linksHTML = `
                            {/* External Links */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle">
                                <a href="https://qran.top/" target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default transition-colors text-emerald-600 dark:text-emerald-400 group" title="الموقع الرئيسي">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 15h17.25M5.625 15v1.5a2.25 2.25 0 002.25 2.25h8.25a2.25 2.25 0 002.25-2.25V15M5.625 15l-1.5-10.5h15.75l-1.5 10.5m-12.75 0h12.75" />
                                    </svg>
                                    <span className="text-[11px] font-bold whitespace-nowrap">الرئيسي</span>
                                </a>
                                <a href="https://qran-top.github.io/" target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default transition-colors text-text-secondary hover:text-primary group" title="النسخة الاحتياطية على GitHub">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    <span className="text-[11px] font-bold whitespace-nowrap">احتياطية</span>
                                </a>
                            </div>`;

if (!code.includes('https://qran.top/')) {
    code = code.replace(
        /<\/span>\s*<\/div>\s*<\/button>\s*<\/nav>/,
        `</span>\n                                </div>\n                            </button>\n${linksHTML}\n                        </nav>`
    );
    fs.writeFileSync('components/SidePanel.tsx', code);
    console.log("Patched SidePanel.tsx successfully.");
} else {
    console.log("SidePanel already has links.");
}

