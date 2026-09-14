const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    const searchOld = `                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                {reverseSearchResults.length} كلمة مطابقة
                            </span>`;
    const searchNew = `                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                {reverseSearchResults.length} كلمة (بصمة: {binaryString})
                            </span>`;
    if (content.includes(searchOld)) {
        content = content.replace(searchOld, searchNew);
        fs.writeFileSync(file, content);
    }
}
patchFile('./components/search/MuqattaatBinaryMatrix.tsx');
