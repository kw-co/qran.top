const fs = require('fs');
let content = fs.readFileSync('components/AppRouter.tsx', 'utf8');

// For page mode
content = content.replace(
  'forcedPageNumber={pageNumber}\n                />',
  'forcedPageNumber={pageNumber}\n                    continuousPlaylist={simpleSearchableAyahs}\n                />'
);

// For surah mode
content = content.replace(
  'hizbQuarterStartMap={hizbQuarterStartMap}\n                />',
  'hizbQuarterStartMap={hizbQuarterStartMap}\n                    continuousPlaylist={simpleSearchableAyahs}\n                />'
);

fs.writeFileSync('components/AppRouter.tsx', content);
