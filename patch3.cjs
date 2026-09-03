const fs = require('fs');
let content = fs.readFileSync('hooks/useSearchLogic.ts', 'utf8');

const startDisp = content.indexOf('const displayedResults = useMemo(() => {');
const endDisp = content.indexOf('}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, activeDiacriticFilter, isSingleWordSearch, isRootSearch]);', startDisp) + '}, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, activeDiacriticFilter, isSingleWordSearch, isRootSearch]);'.length;

const newDisp = `    const displayedResults = useMemo(() => {
        let filtered = applyFilters(activeResults);
        
        if (searchType === 'text' && queryWords.length > 0) {
            filtered.sort((a, b) => {
                const tierA = getAyahMatchTier(a, queryWords);
                const tierB = getAyahMatchTier(b, queryWords);
                if (tierA !== tierB) return tierA - tierB;
                return 0; 
            });
        }
        return filtered;
    }, [activeResults, queryWords, exactMatch, searchType, activePhraseFilter, activeMuqattaatFilter, activeDiacriticFilter, isSingleWordSearch, isRootSearch, displayEditionData]);`;

content = content.substring(0, startDisp) + newDisp + content.substring(endDisp);
fs.writeFileSync('hooks/useSearchLogic.ts', content);
