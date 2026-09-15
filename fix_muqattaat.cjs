const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    // Construct the 29-bit binary string (1 for present, 0 for absent)
    const { binaryString, items, presentCount } = useMemo(() => {
        const list = MUQATTAAT_29_SURAHS.map(s => {`;

const repl1 = `    // Construct the 29-bit binary string (1 for present, 0 for absent)
    const { binaryString, items, presentCount } = useMemo(() => {
        const list = [...MUQATTAAT_29_SURAHS].reverse().map(s => {`;
        
content = content.replace(target1, repl1);

const layoutBtnRegex = /<div className="flex items-center bg-surface-subtle border border-border-default rounded-lg p-0.5 mt-2 sm:mt-0">[\s\S]*?<\/div>/;

const gridContainerRegex = /<div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1\.5">[\s\S]*?<\/div>\s*<\/div>/;

const newGridContainer = `<div className="flex flex-col gap-1.5 items-center">
                    {items.slice(0, 1).map((item, index) => {
                        const effectiveIsPresent = isManualMode ? manualSurahs.has(item.surahNumber) : item.isPresent;
                        const effectiveIsAvailable = isManualMode ? true : item.isAvailable;
                        const isActiveFilter = activeMuqattaatFilter.includes(item.letters);
                        return renderSurahItem(item, effectiveIsPresent, effectiveIsAvailable, isActiveFilter, index);
                    })}
                    {Array.from({ length: 7 }).map((_, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1.5 justify-center">
                            {items.slice(1 + rowIndex * 4, 1 + (rowIndex + 1) * 4).map((item, colIndex) => {
                                const index = 1 + rowIndex * 4 + colIndex;
                                const effectiveIsPresent = isManualMode ? manualSurahs.has(item.surahNumber) : item.isPresent;
                                const effectiveIsAvailable = isManualMode ? true : item.isAvailable;
                                const isActiveFilter = activeMuqattaatFilter.includes(item.letters);
                                return renderSurahItem(item, effectiveIsPresent, effectiveIsAvailable, isActiveFilter, index);
                            })}
                        </div>
                    ))}
                </div>
            </div>`;

content = content.replace(gridContainerRegex, newGridContainer);
content = content.replace(layoutBtnRegex, "");

fs.writeFileSync(file, content);
console.log("Success");
