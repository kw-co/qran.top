const fs = require('fs');
let code = fs.readFileSync('hooks/useQuranData.ts', 'utf8');

// replace the fetching loop with Promise.any
const replacement = `
        const urls = getEditionFallbackUrls(editionToFetch);
        let successSurahs = null;
        let lastError = null;

        try {
            // Fetch from all mirrors concurrently, taking the first valid response
            successSurahs = await Promise.any(urls.map(async (url) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(\`Network error \${response.status}\`);
                const apiData = await response.json();
                const surahs = processApiData(apiData);
                if (surahs && surahs.length > 0) return surahs;
                throw new Error("Invalid data");
            }));
        } catch (err) {
            console.warn(\`All mirrors failed for edition \${editionIdentifier}\`, err);
            lastError = err;
        }

        if (successSurahs) {`;

code = code.replace(/const urls = getEditionFallbackUrls\(editionToFetch\);[\s\S]*?if \(successSurahs\) \{/, replacement.trim() + ' {');

fs.writeFileSync('hooks/useQuranData.ts', code);
