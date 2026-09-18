const fs = require('fs');
const file = 'components/search/SearchResultsHeader.tsx';
let code = fs.readFileSync(file, 'utf8');

const formulaClickFn = `
    const handleFormulaClick = (formula: string) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = (activeMuqattaatFilter || '').split(',').map(f => f.trim()).filter(Boolean);
        let nextFilters: string[];
        if (currentFilters.includes(formula)) {
            nextFilters = currentFilters.filter(f => f !== formula);
        } else {
            nextFilters = [...currentFilters, formula];
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    };
`;

if (!code.includes('handleFormulaClick')) {
    code = code.replace(
        /const toggleMuqattaat = \(\) => {/,
        `${formulaClickFn}\n    const toggleMuqattaat = () => {`
    );

    code = code.replace(
        /<span \n +key=\{index\}\n +className=\{\`flex items-center justify-center px-1\.5 py-1 text-\[9px\] leading-none font-amiri transition-colors \$\{\n +item\.isMentioned \n +\? 'text-green-600 bg-green-500\/10 font-bold' \n +: 'text-gray-400 bg-surface opacity-60'\n +\} \$\{(index === 28 \? 'col-span-4' : '')\}\`\}\n +>\n +\{item\.letters\}\n +<\/span>/g,
        `<button 
                                    key={index}
                                    onClick={() => handleFormulaClick(item.letters)}
                                    className={\`flex items-center justify-center px-1.5 py-1 text-[9px] leading-none font-amiri transition-all cursor-pointer \${
                                        item.isMentioned 
                                            ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20 font-bold' 
                                            : 'text-gray-400 bg-surface opacity-60 hover:opacity-100 hover:bg-surface-hover'
                                    } \${
                                        (activeMuqattaatFilter || '').split(',').map(f=>f.trim()).includes(item.letters)
                                            ? 'ring-1 ring-inset ring-green-500 bg-green-500/30 text-green-800 dark:text-green-200'
                                            : ''
                                    } \${index === 28 ? 'col-span-4' : ''}\`}
                                    title={\`تصفية سورة/سور \${item.letters}\`}
                                >
                                    {item.letters}
                                </button>`
    );
    
    fs.writeFileSync(file, code);
    console.log("Patched SearchResultsHeader.tsx successfully.");
} else {
    console.log("Already patched.");
}
