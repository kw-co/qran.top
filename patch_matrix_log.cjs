const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    const searchOld = `            const results = findWordsByFingerprint(simpleCleanData, binaryString, false, asRoot);`;
    const searchNew = `            console.log("REVERSE SEARCH CALL: binaryString=", binaryString, "asRoot=", asRoot);
            const results = findWordsByFingerprint(simpleCleanData, binaryString, false, asRoot);
            console.log("REVERSE SEARCH RESULTS LENGTH=", results.length);`;
    if (content.includes(searchOld)) {
        content = content.replace(searchOld, searchNew);
        fs.writeFileSync(file, content);
    }
}
patchFile('./components/search/MuqattaatBinaryMatrix.tsx');
