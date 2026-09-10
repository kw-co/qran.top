const fs = require('fs');
const file = './hooks/useSearchLogic.ts';
let content = fs.readFileSync(file, 'utf8');

// Insert SURAH_MUQATTAAT_MAP
if (!content.includes('SURAH_MUQATTAAT_MAP')) {
    const mapStr = `\nconst SURAH_MUQATTAAT_MAP: Record<number, string> = {
    2: "الم", 3: "الم", 7: "المص", 10: "الر", 11: "الر", 12: "الر", 13: "المر", 14: "الر", 15: "الر",
    19: "كهيعص", 20: "طه", 26: "طسم", 27: "طس", 28: "طسم", 29: "الم", 30: "الم", 31: "الم", 32: "الم",
    36: "يس", 38: "ص", 40: "حم", 41: "حم", 42: "حم عسق", 43: "حم", 44: "حم", 45: "حم", 46: "حم",
    50: "ق", 68: "ن"
};\n`;
    content = content.replace(
        "import { safeLocalStorage } from '../utils/storage';",
        "import { safeLocalStorage } from '../utils/storage';" + mapStr
    );
}

// Add state for activeMuqattaatFilter
if (!content.includes('activeMuqattaatFilter')) {
    content = content.replace(
        "const [activePhraseFilter, setActivePhraseFilter] = useState('all');",
        "const [activePhraseFilter, setActivePhraseFilter] = useState('all');\n    const [activeMuqattaatFilter, setActiveMuqattaatFilter] = useState('');"
    );
    
    // Add logic to filter by activeMuqattaatFilter
    content = content.replace(
        "if (activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '') {",
        `if (activeMuqattaatFilter && activeMuqattaatFilter.trim() !== '') {
            const mFilters = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
            if (mFilters.length > 0) {
                filtered = filtered.filter(ayah => {
                    const ayahMuqattaat = SURAH_MUQATTAAT_MAP[ayah.surah?.number || 0];
                    return mFilters.includes(ayahMuqattaat);
                });
            }
        }
        
        if (activePhraseFilter !== 'all' && activePhraseFilter.trim() !== '') {`
    );
    
    // Add activeMuqattaatFilter to dependencies
    content = content.replace(
        "}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, isSingleWordSearch, isRootSearch]);",
        "}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, isSingleWordSearch, isRootSearch]);"
    );
    
    // Return the new states
    content = content.replace(
        "activePhraseFilter, setActivePhraseFilter,",
        "activePhraseFilter, setActivePhraseFilter,\n        activeMuqattaatFilter, setActiveMuqattaatFilter,"
    );
}

fs.writeFileSync(file, content);
