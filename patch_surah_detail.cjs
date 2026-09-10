const fs = require('fs');
let content = fs.readFileSync('components/SurahDetailView.tsx', 'utf8');

// 1. Add continuousPlaylist to props interface
content = content.replace(
  'forcedPageNumber?: number; // Prop to enforce a specific page number\n}',
  'forcedPageNumber?: number; // Prop to enforce a specific page number\n  continuousPlaylist?: Ayah[];\n}'
);

// 2. Add continuousPlaylist to component destructured arguments
content = content.replace(
  'simpleCleanData, hizbQuarterStartMap, forcedPageNumber\n})',
  'simpleCleanData, hizbQuarterStartMap, forcedPageNumber, continuousPlaylist\n})'
);

// 3. Update the handlePlayFromAyah function
const targetPlayFn = `    const startIndex = ayahsWithSurahInfo.findIndex(a => a.number === ayah.number);
    if (startIndex !== -1) {
        onStartPlayback(ayahsWithSurahInfo, selectedAudioEdition, startIndex);
    }`;
    
const replacementPlayFn = `    const playlistToUse = continuousPlaylist || ayahsWithSurahInfo;
    const startIndex = playlistToUse.findIndex(a => a.number === ayah.number);
    if (startIndex !== -1) {
        onStartPlayback(playlistToUse, selectedAudioEdition, startIndex);
    }`;

content = content.replace(targetPlayFn, replacementPlayFn);

fs.writeFileSync('components/SurahDetailView.tsx', content);
