const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLayerGroups = `    // Layered Layout (7 rows of 4 + 1 on top)
    const layerGroups = useMemo(() => {
        return [
            [items[28]], // Top (N)
            [items[27], items[26], items[25], items[24]],
            [items[23], items[22], items[21], items[20]],
            [items[19], items[18], items[17], items[16]],
            [items[15], items[14], items[13], items[12]],
            [items[11], items[10], items[9], items[8]],
            [items[7], items[6], items[5], items[4]],
            [items[3], items[2], items[1], items[0]],
        ];
    }, [items]);`;
    
const replLayerGroups = `    // Layered Layout (7 rows of 4 + 1 on top)
    // Order from items array (already reversed from MUQATTAAT_29_SURAHS)
    // items[0] is N (68)
    // items[1..4] is Q (50) to Dukhan (44)
    const layerGroups = useMemo(() => {
        return [
            [items[0]], // Top (N)
            [items[1], items[2], items[3], items[4]],
            [items[5], items[6], items[7], items[8]],
            [items[9], items[10], items[11], items[12]],
            [items[13], items[14], items[15], items[16]],
            [items[17], items[18], items[19], items[20]],
            [items[21], items[22], items[23], items[24]],
            [items[25], items[26], items[27], items[28]],
        ];
    }, [items]);`;

content = content.replace(targetLayerGroups, replLayerGroups);

const newGridRegex = /<div className="flex flex-col gap-1\.5 items-center">[\s\S]*?<\/div>\s*<\/div>/;

const newGridLayout = `<div className="flex flex-col gap-1.5 items-center">
                    {layerGroups.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1.5 justify-center w-full">
                            {row.map((item) => (
                                <div key={item.surahNumber} className="w-[12%] max-w-[50px] min-w-[36px]">
                                    {renderCell(item)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>`;

content = content.replace(newGridRegex, newGridLayout);

fs.writeFileSync(file, content);
console.log("Success");
