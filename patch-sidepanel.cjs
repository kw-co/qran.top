const fs = require('fs');
let code = fs.readFileSync('components/SidePanel.tsx', 'utf8');

// Update version in index.html as well
let indexCode = fs.readFileSync('index.html', 'utf8');
indexCode = indexCode.replace(/1\.0\.11/g, '1.0.12');
fs.writeFileSync('index.html', indexCode);

// Update version
code = code.replace(/v1\.0\.10/g, 'v1.0.12');

// Add PWA hook import
if (!code.includes('usePWAInstall')) {
    code = code.replace(
        /import React, \{ useState, useEffect \} from 'react';/,
        `import React, { useState, useEffect } from 'react';\nimport { usePWAInstall } from '../hooks/usePWAInstall';`
    );
}

// Add PWA button to the nav menu
const pwaBtn = `
                            {/* PWA Install Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (promptInstall) {
                                        promptInstall();
                                    } else {
                                        alert('لتثبيت التطبيق من المتصفح: \\nفي هواتف أندرويد (Chrome): اضغط على القائمة (ثلاث نقاط) ثم "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".\\nفي هواتف آيفون (Safari): اضغط على زر المشاركة ثم "إضافة إلى الصفحة الرئيسية".');
                                    }
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg text-base transition-colors text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer text-right group"
                            >
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="whitespace-nowrap font-medium text-text-primary">إضافة للشاشة الرئيسية (بدون متجر)</span>
                                </div>
                            </button>
`;

if (!code.includes('إضافة للشاشة الرئيسية (بدون متجر)')) {
    code = code.replace(
        /const SidePanel: React\.FC<SidePanelProps> = \(\{\s*isOpen, onClose, currentPath, onNavigate\s*\}\) => \{/,
        `const SidePanel: React.FC<SidePanelProps> = ({\n    isOpen, onClose, currentPath, onNavigate\n}) => {\n    const { promptInstall } = usePWAInstall();`
    );

    code = code.replace(
        /<NavLink href="#\/settings" icon=\{<CogIcon className="w-5 h-5" \/>\} label="الإعدادات" onNavigate=\{onNavigate\} isActive=\{currentPath\.startsWith\('#\/settings'\)\} \/>/,
        `<NavLink href="#/settings" icon={<CogIcon className="w-5 h-5" />} label="الإعدادات" onNavigate={onNavigate} isActive={currentPath.startsWith('#/settings')} />\n${pwaBtn}`
    );
}

fs.writeFileSync('components/SidePanel.tsx', code);
console.log("Patched side panel.");
