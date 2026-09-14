const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add useEffect to clear reverseSearchResults when binaryString changes
    const useEffectString = `    useEffect(() => {
        setReverseSearchResults(null);
    }, [binaryString]);`;
    
    if (!content.includes('setReverseSearchResults(null);')) {
        // Insert it after `const [reverseSearchResults, setReverseSearchResults] = useState...`
        // or just before `return (`
        content = content.replace(
            `    const handleReverseSearch = useCallback(() => {`,
            `${useEffectString}\n\n    const handleReverseSearch = useCallback(() => {`
        );
    }
    
    // 2. Remove the "Root" toggle if we added it (we didn't successfully add it, but just in case)
    // Actually, I'll just leave it clean.
    
    fs.writeFileSync(file, content);
}

patchFile('./components/search/MuqattaatBinaryMatrix.tsx');
patchFile('./components/search/HawameemBinaryMatrix.tsx');
