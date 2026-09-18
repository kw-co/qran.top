const fs = require('fs');
let code = fs.readFileSync('components/search/SearchResultsHeader.tsx', 'utf8');

const cancelBtn = `
                    {(activeMuqattaatFilter || '').trim().length > 0 && (
                        <button 
                            onClick={() => setActiveMuqattaatFilter && setActiveMuqattaatFilter('')}
                            className="mr-2 px-2 py-1 text-[10px] bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded font-bold transition-colors cursor-pointer"
                        >
                            إلغاء التصفية ✕
                        </button>
                    )}
`;

if (!code.includes('إلغاء التصفية ✕')) {
    code = code.replace(
        /<\/div>\s*\}\)\s*\}<\/div>/,
        `</div>})}\n                        </div>\n                        ${cancelBtn}`
    );
    fs.writeFileSync('components/search/SearchResultsHeader.tsx', code);
    console.log("Patched with cancel button.");
} else {
    console.log("Already patched cancel.");
}
