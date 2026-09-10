const fs = require('fs');
let content = fs.readFileSync('hooks/useAudioPlayer.ts', 'utf8');

const targetFunctionRegex = /const getPlaylistData = \(\) => \{[\s\S]*?return \[\];\n        \};\n/;

const replacement = `const getPlaylistData = () => {
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);
            const uthmaniData = allQuranData?.['quran-uthmani-quran-academy'] || allQuranData?.['quran-uthmani'];
            
            if (!uthmaniData) {
                return ayahsForPlaylist.length > 0 ? ayahsForPlaylist.slice(startIndex) : [];
            }

            const allAyahsContinuous = uthmaniData.flatMap(surah => 
                surah.ayahs.map(ayah => ({
                    ...ayah,
                    surah: { number: surah.number, name: surah.name, englishName: surah.englishName, englishNameTranslation: surah.englishNameTranslation, revelationType: surah.revelationType, numberOfAyahs: surah.numberOfAyahs }
                }))
            );

            if (ayahsForPlaylist.length > 0) {
                 const firstAyah = ayahsForPlaylist[startIndex];
                 if (firstAyah && firstAyah.number) {
                     const globalIndex = allAyahsContinuous.findIndex(a => a.number === firstAyah.number);
                     if (globalIndex !== -1) {
                         return allAyahsContinuous.slice(globalIndex);
                     }
                 }
                 return ayahsForPlaylist.slice(startIndex);
            }

            // Case 1: Surah Playback
            if (pathParts[0] === 'surah' && pathParts[1]) {
                const surahNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.surah?.number === surahNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }
            
            // Case 2: Page Playback
            if (pathParts[0] === 'page' && pathParts[1]) {
                const pageNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.page === pageNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }

            return [];
        };
`;

content = content.replace(targetFunctionRegex, replacement);

fs.writeFileSync('hooks/useAudioPlayer.ts', content);
console.log('Successfully patched getPlaylistData');
